import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Quote } from "@/core/market/types";
import { MockProvider } from "./mock-provider";

const NOW = Date.UTC(2026, 9, 25, 12, 34, 56);

describe("MockProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("finds instruments by symbol and name, case-insensitive", async () => {
    const provider = new MockProvider();
    expect((await provider.searchInstruments("btc")).map((i) => i.symbol)).toEqual(["BTCUSDT"]);
    expect((await provider.searchInstruments("apple")).map((i) => i.symbol)).toEqual(["AAPL"]);
    expect(await provider.searchInstruments("  ")).toEqual([]);
  });

  it("only offers instruments of its markets and tags them with its id", async () => {
    const provider = new MockProvider({ id: "mock-crypto", markets: ["crypto"] });
    const results = await provider.searchInstruments("e");
    expect(results.every((i) => i.market === "crypto" && i.providerId === "mock-crypto")).toBe(true);
  });

  it("returns the requested number of consistent candles, oldest first, ending at the current period", async () => {
    const provider = new MockProvider({ now: () => NOW });
    const candles = await provider.getCandles("AAPL", "1H", 50);

    expect(candles).toHaveLength(50);
    expect(candles[candles.length - 1].time).toBe(Date.UTC(2026, 9, 25, 12));
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].time - candles[i - 1].time).toBe(60 * 60_000);
    }
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
    }
  });

  it("generates the same candles for the same input", async () => {
    const provider = new MockProvider({ now: () => NOW });
    expect(await provider.getCandles("AAPL", "1D", 10)).toEqual(await provider.getCandles("AAPL", "1D", 10));
  });

  it("streams quotes with its data mode until unsubscribed", () => {
    const provider = new MockProvider({ dataMode: "delayed", quoteIntervalMs: 1000, now: () => NOW });
    const quotes: Quote[] = [];
    const unsubscribe = provider.subscribeQuotes(["AAPL", "SAP.DE"], (q) => quotes.push(q));

    vi.advanceTimersByTime(3000);
    expect(quotes).toHaveLength(6);
    expect(new Set(quotes.map((q) => q.symbol))).toEqual(new Set(["AAPL", "SAP.DE"]));
    expect(quotes.every((q) => q.dataMode === "delayed" && q.timestamp === NOW && q.price > 0)).toBe(true);

    unsubscribe();
    vi.advanceTimersByTime(3000);
    expect(quotes).toHaveLength(6);
  });
});
