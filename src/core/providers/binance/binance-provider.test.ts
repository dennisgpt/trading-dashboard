import { describe, expect, it, vi } from "vitest";
import type { Candle, Quote } from "@/core/market/types";
import { BinanceProvider } from "./binance-provider";
import { fakeSocketFactory } from "./fake-socket";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function setup(responses: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(responses).find((path) => url.includes(path));
    return key ? jsonResponse(responses[key]) : jsonResponse({ msg: "not found" }, 404);
  });
  const sockets = fakeSocketFactory();
  const provider = new BinanceProvider({ restUrl: "https://rest.test", fetch: fetchMock as typeof fetch, createSocket: sockets.create });
  return { provider, fetchMock, sockets };
}

const PRICES = [
  { symbol: "BTCUSDT", price: "80423.00" },
  { symbol: "BTCEUR", price: "74000.10" },
  { symbol: "ETHBTC", price: "0.02901" },
  { symbol: "ETHUSDT", price: "2330.50" },
  { symbol: "SOLUSDT", price: "142.12" },
  { symbol: "PEPEUSDT", price: "0.00000812" },
  { symbol: "BTCTRY", price: "2900000" },
  { symbol: "OLDUSDT", price: "0.00000000" },
];

describe("BinanceProvider", () => {
  it("declares itself as live crypto provider", () => {
    const { provider } = setup({});
    expect(provider).toMatchObject({ id: "binance", markets: ["crypto"], dataMode: "live" });
  });

  it("loads candles from /api/v3/klines with the mapped interval", async () => {
    const { provider, fetchMock } = setup({
      "/api/v3/klines": [
        [1700000000000, "100.0", "110.5", "95.25", "105.0", "12.5", 1700003599999, "0", 10],
        [1700003600000, "105.0", "106.0", "104.0", "105.5", "3", 1700007199999, "0", 4],
      ],
    });

    const candles = await provider.getCandles("BTCUSDT", "1H", 2);

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://rest.test/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=2");
    expect(candles).toEqual<Candle[]>([
      { time: 1700000000000, open: 100, high: 110.5, low: 95.25, close: 105, volume: 12.5 },
      { time: 1700003600000, open: 105, high: 106, low: 104, close: 105.5, volume: 3 },
    ]);
  });

  it("caps the candle limit at 1000", async () => {
    const { provider, fetchMock } = setup({ "/api/v3/klines": [] });
    await provider.getCandles("BTCUSDT", "1W", 5000);
    expect(String(fetchMock.mock.calls[0][0])).toContain("interval=1w&limit=1000");
  });

  it("throws on HTTP errors", async () => {
    const { provider } = setup({});
    await expect(provider.getCandles("BTCUSDT", "1m", 10)).rejects.toThrow(/404/);
  });

  it("searches pairs with supported quote assets, best matches first, and caches the symbol list", async () => {
    const { provider, fetchMock } = setup({ "/api/v3/ticker/price": PRICES });

    const btc = await provider.searchInstruments("btc");
    expect(btc.map((i) => i.symbol)).toEqual(["BTCUSDT", "BTCEUR", "ETHBTC"]);
    expect(btc[0]).toEqual({
      symbol: "BTCUSDT",
      displaySymbol: "BTC/USDT",
      name: "Bitcoin",
      market: "crypto",
      currency: "USDT",
      decimals: 2,
      providerId: "binance",
    });

    const bySlash = await provider.searchInstruments("eth/usdt");
    expect(bySlash.map((i) => i.symbol)).toEqual(["ETHUSDT"]);

    const byName = await provider.searchInstruments("solana");
    expect(byName.map((i) => i.symbol)).toEqual(["SOLUSDT"]);

    const pepe = await provider.searchInstruments("pepe");
    expect(pepe[0].decimals).toBe(8);

    expect(await provider.searchInstruments("old")).toEqual([]);
    expect(await provider.searchInstruments("  ")).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps ticker events to live quotes", () => {
    const { provider, sockets } = setup({});
    const quotes: Quote[] = [];
    provider.subscribeQuotes(["BTCUSDT", "BTCUSDT"], (q) => quotes.push(q));
    sockets.last().open();
    sockets.last().push("btcusdt@ticker", { E: 1792927130014, s: "BTCUSDT", c: "80423.00", P: "-0.277", h: "81033.69", l: "79220.74" });

    expect(quotes).toEqual<Quote[]>([
      { symbol: "BTCUSDT", price: 80423, changePercent: -0.277, high: 81033.69, low: 79220.74, timestamp: 1792927130014, dataMode: "live" },
    ]);
  });

  it("maps kline events to the running candle", () => {
    const { provider, sockets } = setup({});
    const candles: Candle[] = [];
    provider.subscribeCandles("ETHUSDT", "5m", (c) => candles.push(c));
    sockets.last().open();
    sockets.last().push("ethusdt@kline_5m", { k: { t: 1700000000000, o: "1", h: "2", l: "0.5", c: "1.5", v: "100" } });

    expect(candles).toEqual([{ time: 1700000000000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }]);
  });

  it("reports the connection status", () => {
    const { provider, sockets } = setup({});
    const statuses: string[] = [];
    provider.subscribeStatus((s) => statuses.push(s));
    const unsubscribe = provider.subscribeQuotes(["BTCUSDT"], vi.fn());
    sockets.last().open();
    unsubscribe();
    expect(statuses).toEqual(["disconnected", "connecting", "connected", "disconnected"]);
  });
});
