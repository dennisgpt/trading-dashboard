import type { Unsubscribe } from "@/core/market/provider";
import type { ConnectionStatus } from "@/core/market/types";

/** The part of the browser WebSocket API the stream needs; replaced by a fake in tests. */
export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(): void;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
}

export type SocketFactory = (url: string) => SocketLike;

const OPEN = 1;
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
/** Ticker streams push every second; this long without any message means the connection is dead. */
const WATCHDOG_MS = 15_000;

type MessageHandler = (data: unknown) => void;

export interface BinanceStreamOptions {
  url: string;
  createSocket?: SocketFactory;
  /** Source of jitter for the reconnect delay, injectable for tests. */
  random?: () => number;
}

/**
 * One combined-stream WebSocket to Binance (`/stream`), shared by all subscriptions.
 * Streams are reference-counted and (un)subscribed with SUBSCRIBE/UNSUBSCRIBE messages.
 * Reconnects with exponential backoff and re-subscribes everything after a reconnect.
 */
export class BinanceStream {
  private readonly url: string;
  private readonly createSocket: SocketFactory;
  private readonly random: () => number;

  private socket: SocketLike | null = null;
  private readonly handlers = new Map<string, Set<MessageHandler>>();
  private readonly pendingSubscribe = new Set<string>();
  private readonly pendingUnsubscribe = new Set<string>();
  private flushScheduled = false;
  private nextRequestId = 1;

  private status: ConnectionStatus = "disconnected";
  private readonly statusListeners = new Set<(status: ConnectionStatus) => void>();
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: BinanceStreamOptions) {
    this.url = options.url;
    this.createSocket = options.createSocket ?? ((url) => new WebSocket(url) as unknown as SocketLike);
    this.random = options.random ?? Math.random;
  }

  subscribe(stream: string, handler: MessageHandler): Unsubscribe {
    let set = this.handlers.get(stream);
    if (!set) {
      set = new Set();
      this.handlers.set(stream, set);
      this.pendingUnsubscribe.delete(stream);
      this.pendingSubscribe.add(stream);
      this.scheduleFlush();
    }
    set.add(handler);
    this.ensureConnected();

    let active = true;
    return () => {
      if (!active) return;
      active = false;
      const current = this.handlers.get(stream);
      if (!current) return;
      current.delete(handler);
      if (current.size > 0) return;
      this.handlers.delete(stream);
      this.pendingSubscribe.delete(stream);
      this.pendingUnsubscribe.add(stream);
      if (this.handlers.size === 0) this.shutDown();
      else this.scheduleFlush();
    };
  }

  /** Calls the listener with the current status right away and on every change. */
  onStatus(listener: (status: ConnectionStatus) => void): Unsubscribe {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    if (status === this.status) return;
    this.status = status;
    for (const listener of this.statusListeners) listener(status);
  }

  private ensureConnected(): void {
    if (this.socket || this.reconnectTimer) return;
    this.connect();
  }

  private connect(): void {
    this.setStatus("connecting");
    const socket = this.createSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setStatus("connected");
      // A fresh connection has no subscriptions: subscribe to everything that is active now.
      this.pendingUnsubscribe.clear();
      for (const stream of this.handlers.keys()) this.pendingSubscribe.add(stream);
      this.flush();
      this.armWatchdog();
    };
    socket.onmessage = (event) => {
      this.armWatchdog();
      this.dispatch(event.data);
    };
    socket.onclose = () => {
      if (this.socket === socket) this.handleConnectionLost();
    };
    socket.onerror = () => {
      // A close event always follows; reconnecting is handled there.
    };
  }

  private dispatch(raw: unknown): void {
    if (typeof raw !== "string") return;
    let message: { stream?: unknown; data?: unknown };
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    // Replies to SUBSCRIBE ({"result":null,"id":1}) carry no stream and are ignored.
    if (typeof message.stream !== "string") return;
    const handlers = this.handlers.get(message.stream);
    if (!handlers) return;
    for (const handler of handlers) handler(message.data);
  }

  private handleConnectionLost(): void {
    this.detachSocket();
    this.clearWatchdog();
    this.setStatus("disconnected");
    if (this.handlers.size > 0) this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const base = Math.min(MAX_BACKOFF_MS, INITIAL_BACKOFF_MS * 2 ** this.attempt);
    const delay = base * (0.8 + 0.4 * this.random());
    this.attempt++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.handlers.size > 0) this.connect();
    }, delay);
  }

  private armWatchdog(): void {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      // Closing a dead socket can take long to report; drop it and reconnect right away.
      const socket = this.socket;
      this.handleConnectionLost();
      socket?.close();
    }, WATCHDOG_MS);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = null;
  }

  private detachSocket(): void {
    const socket = this.socket;
    if (!socket) return;
    socket.onopen = socket.onclose = socket.onerror = null;
    socket.onmessage = null;
    this.socket = null;
  }

  /** No subscriptions left: close the connection and stop reconnecting. */
  private shutDown(): void {
    const socket = this.socket;
    this.detachSocket();
    socket?.close();
    this.clearWatchdog();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.attempt = 0;
    this.pendingSubscribe.clear();
    this.pendingUnsubscribe.clear();
    this.setStatus("disconnected");
  }

  private scheduleFlush(): void {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    // Batch all changes of the current tick into one message (Binance allows 5 messages per second).
    setTimeout(() => {
      this.flushScheduled = false;
      this.flush();
    }, 0);
  }

  private flush(): void {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN) return;
    if (this.pendingUnsubscribe.size > 0) {
      socket.send(JSON.stringify({ method: "UNSUBSCRIBE", params: [...this.pendingUnsubscribe], id: this.nextRequestId++ }));
      this.pendingUnsubscribe.clear();
    }
    if (this.pendingSubscribe.size > 0) {
      socket.send(JSON.stringify({ method: "SUBSCRIBE", params: [...this.pendingSubscribe], id: this.nextRequestId++ }));
      this.pendingSubscribe.clear();
    }
  }
}
