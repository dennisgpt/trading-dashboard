import type { SocketLike } from "./binance-stream";

/** In-memory WebSocket stand-in for tests: records sent messages, lets the test open/close it and push messages. */
export class FakeSocket implements SocketLike {
  readyState = 0;
  readonly sent: { method: string; params: string[] }[] = [];
  closed = false;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(readonly url: string) {}

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(): void {
    this.closed = true;
    this.readyState = 3;
  }

  /** Test helpers */
  open(): void {
    this.readyState = 1;
    this.onopen?.();
  }

  drop(): void {
    this.readyState = 3;
    this.onclose?.();
  }

  push(stream: string, data: unknown): void {
    this.onmessage?.({ data: JSON.stringify({ stream, data }) });
  }
}

export function fakeSocketFactory() {
  const sockets: FakeSocket[] = [];
  const create = (url: string) => {
    const socket = new FakeSocket(url);
    sockets.push(socket);
    return socket;
  };
  return { sockets, create, last: () => sockets[sockets.length - 1] };
}
