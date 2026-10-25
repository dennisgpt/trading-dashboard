import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectionStatus } from "@/core/market/types";
import { BinanceStream } from "./binance-stream";
import { fakeSocketFactory } from "./fake-socket";

function setup() {
  const factory = fakeSocketFactory();
  // random() = 0.5 → no jitter: delays are exactly 1s, 2s, 4s ...
  const stream = new BinanceStream({ url: "wss://test/stream", createSocket: factory.create, random: () => 0.5 });
  const statuses: ConnectionStatus[] = [];
  stream.onStatus((s) => statuses.push(s));
  return { stream, factory, statuses };
}

describe("BinanceStream", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("connects on the first subscription and subscribes all streams of the tick in one message", () => {
    const { stream, factory, statuses } = setup();
    stream.subscribe("btcusdt@ticker", vi.fn());
    stream.subscribe("ethusdt@ticker", vi.fn());

    expect(factory.sockets).toHaveLength(1);
    expect(statuses).toEqual(["disconnected", "connecting"]);

    factory.last().open();
    vi.advanceTimersByTime(0);
    expect(statuses[statuses.length - 1]).toBe("connected");
    expect(factory.last().sent).toEqual([{ method: "SUBSCRIBE", params: ["btcusdt@ticker", "ethusdt@ticker"], id: 1 }]);
  });

  it("delivers messages to every handler of a stream and ignores subscription replies", () => {
    const { stream, factory } = setup();
    const a = vi.fn();
    const b = vi.fn();
    stream.subscribe("btcusdt@ticker", a);
    stream.subscribe("btcusdt@ticker", b);
    factory.last().open();

    factory.last().onmessage?.({ data: JSON.stringify({ result: null, id: 1 }) });
    factory.last().push("btcusdt@ticker", { c: "1" });
    factory.last().push("ethusdt@ticker", { c: "2" });

    expect(a).toHaveBeenCalledExactlyOnceWith({ c: "1" });
    expect(b).toHaveBeenCalledExactlyOnceWith({ c: "1" });
  });

  it("unsubscribes a stream only when its last handler leaves", () => {
    const { stream, factory } = setup();
    const unsubA = stream.subscribe("btcusdt@ticker", vi.fn());
    const unsubB = stream.subscribe("btcusdt@ticker", vi.fn());
    stream.subscribe("ethusdt@ticker", vi.fn());
    factory.last().open();
    vi.advanceTimersByTime(0);
    const socket = factory.last();
    socket.sent.length = 0;

    unsubA();
    vi.advanceTimersByTime(0);
    expect(socket.sent).toEqual([]);

    unsubB();
    unsubB();
    vi.advanceTimersByTime(0);
    expect(socket.sent).toEqual([{ method: "UNSUBSCRIBE", params: ["btcusdt@ticker"], id: 2 }]);
  });

  it("closes the connection when nothing is subscribed anymore", () => {
    const { stream, factory, statuses } = setup();
    const unsub = stream.subscribe("btcusdt@ticker", vi.fn());
    factory.last().open();
    unsub();
    expect(factory.last().closed).toBe(true);
    expect(statuses[statuses.length - 1]).toBe("disconnected");
    vi.advanceTimersByTime(60_000);
    expect(factory.sockets).toHaveLength(1);
  });

  it("reconnects with exponential backoff and re-subscribes everything", () => {
    const { stream, factory, statuses } = setup();
    stream.subscribe("btcusdt@ticker", vi.fn());
    stream.subscribe("btcusdt@kline_1m", vi.fn());
    factory.last().open();

    factory.last().drop();
    expect(statuses[statuses.length - 1]).toBe("disconnected");
    vi.advanceTimersByTime(999);
    expect(factory.sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(factory.sockets).toHaveLength(2);
    expect(statuses[statuses.length - 1]).toBe("connecting");

    // second failure in a row waits twice as long
    factory.last().drop();
    vi.advanceTimersByTime(1999);
    expect(factory.sockets).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(factory.sockets).toHaveLength(3);

    factory.last().open();
    expect(statuses[statuses.length - 1]).toBe("connected");
    expect(factory.last().sent).toEqual([{ method: "SUBSCRIBE", params: ["btcusdt@ticker", "btcusdt@kline_1m"], id: expect.any(Number) }]);

    // a successful connection resets the backoff
    factory.last().drop();
    vi.advanceTimersByTime(1000);
    expect(factory.sockets).toHaveLength(4);
  });

  it("caps the backoff at 30 seconds", () => {
    const { stream, factory } = setup();
    stream.subscribe("btcusdt@ticker", vi.fn());
    for (let i = 0; i < 8; i++) {
      factory.last().drop();
      vi.advanceTimersByTime(30_000);
    }
    expect(factory.sockets).toHaveLength(9);
  });

  it("treats a silent connection as dead and reconnects", () => {
    const { stream, factory, statuses } = setup();
    stream.subscribe("btcusdt@ticker", vi.fn());
    factory.last().open();

    vi.advanceTimersByTime(10_000);
    factory.last().push("btcusdt@ticker", {});
    vi.advanceTimersByTime(14_999);
    expect(statuses[statuses.length - 1]).toBe("connected");

    vi.advanceTimersByTime(1);
    expect(statuses[statuses.length - 1]).toBe("disconnected");
    expect(factory.sockets[0].closed).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(factory.sockets).toHaveLength(2);
  });
});
