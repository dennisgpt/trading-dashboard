import { describe, expect, it, vi } from "vitest";
import { MockProvider } from "@/core/providers/mock/mock-provider";
import type { MarketDataProvider } from "./provider";
import { NoProviderError, ProviderRegistry } from "./registry";
import type { Instrument } from "./types";

const btc: Instrument = { symbol: "BTCUSDT", name: "Bitcoin", market: "crypto", currency: "USDT", decimals: 2 };
const sap: Instrument = { symbol: "SAP.DE", name: "SAP SE", market: "de_stock", currency: "EUR", decimals: 2 };
const eurusd: Instrument = { symbol: "EUR/USD", name: "Euro / US-Dollar", market: "forex", currency: "USD", decimals: 5 };

function setup() {
  const registry = new ProviderRegistry();
  const delayedStocks = new MockProvider({ id: "delayed", markets: ["de_stock", "us_stock"], dataMode: "delayed" });
  const liveStocks = new MockProvider({ id: "live", markets: ["us_stock"], dataMode: "live" });
  const crypto = new MockProvider({ id: "crypto", markets: ["crypto"], dataMode: "live" });
  registry.register(delayedStocks);
  registry.register(liveStocks);
  registry.register(crypto);
  return { registry, delayedStocks, liveStocks, crypto };
}

describe("ProviderRegistry", () => {
  it("rejects a second provider with the same id", () => {
    const { registry } = setup();
    expect(() => registry.register(new MockProvider({ id: "crypto" }))).toThrow(/already registered/);
  });

  it("picks the provider serving the instrument's market", () => {
    const { registry, crypto, delayedStocks } = setup();
    expect(registry.providerFor(btc)).toBe(crypto);
    expect(registry.providerFor(sap)).toBe(delayedStocks);
  });

  it("prefers live providers over delayed ones", () => {
    const { registry, liveStocks, delayedStocks } = setup();
    const aapl: Instrument = { symbol: "AAPL", name: "Apple", market: "us_stock", currency: "USD", decimals: 2 };
    expect(registry.forMarket("us_stock")).toEqual([liveStocks, delayedStocks]);
    expect(registry.providerFor(aapl)).toBe(liveStocks);
  });

  it("honours the instrument's providerId if that provider serves the market", () => {
    const { registry, delayedStocks, liveStocks } = setup();
    const aapl: Instrument = { symbol: "AAPL", name: "Apple", market: "us_stock", currency: "USD", decimals: 2 };
    expect(registry.providerFor({ ...aapl, providerId: "delayed" })).toBe(delayedStocks);
    expect(registry.providerFor({ ...aapl, providerId: "crypto" })).toBe(liveStocks);
    expect(registry.providerFor({ ...aapl, providerId: "unknown" })).toBe(liveStocks);
  });

  it("throws NoProviderError when no provider serves the market", () => {
    const { registry } = setup();
    expect(() => registry.providerFor(eurusd)).toThrow(NoProviderError);
  });

  it("subscribes once per provider and stops all subscriptions together", () => {
    const { registry, crypto, liveStocks } = setup();
    const unsubCrypto = vi.fn();
    const unsubStocks = vi.fn();
    const cryptoSpy = vi.spyOn(crypto, "subscribeQuotes").mockReturnValue(unsubCrypto);
    const stocksSpy = vi.spyOn(liveStocks, "subscribeQuotes").mockReturnValue(unsubStocks);
    const aapl: Instrument = { symbol: "AAPL", name: "Apple", market: "us_stock", currency: "USD", decimals: 2 };
    const eth: Instrument = { ...btc, symbol: "ETHUSDT", name: "Ethereum" };
    const onQuote = vi.fn();

    const unsubscribe = registry.subscribeQuotes([btc, aapl, eth, btc], onQuote);

    expect(cryptoSpy).toHaveBeenCalledWith(["BTCUSDT", "ETHUSDT"], onQuote, undefined);
    expect(stocksSpy).toHaveBeenCalledWith(["AAPL"], onQuote, undefined);
    unsubscribe();
    unsubscribe();
    expect(unsubCrypto).toHaveBeenCalledTimes(1);
    expect(unsubStocks).toHaveBeenCalledTimes(1);
  });

  it("searches all providers and tolerates a failing one", async () => {
    const { registry, crypto, delayedStocks } = setup();
    vi.spyOn(delayedStocks, "searchInstruments").mockRejectedValue(new Error("offline"));
    const results = await registry.searchInstruments("a");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((i) => i.providerId !== "delayed")).toBe(true);

    for (const p of [crypto, delayedStocks, registry.get("live")!]) vi.spyOn(p, "searchInstruments").mockRejectedValue(new Error("offline"));
    await expect(registry.searchInstruments("a")).rejects.toThrow("offline");
  });

  it("starts no subscription if one instrument has no provider", () => {
    const { registry, crypto } = setup();
    const spy = vi.spyOn(crypto as MarketDataProvider, "subscribeQuotes");
    expect(() => registry.subscribeQuotes([btc, eurusd], vi.fn())).toThrow(NoProviderError);
    expect(spy).not.toHaveBeenCalled();
  });
});
