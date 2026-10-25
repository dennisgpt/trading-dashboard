import type { MarketDataProvider, QuoteListener, Unsubscribe } from "@/core/market/provider";
import { TIMEFRAME_MS, type Candle, type DataMode, type Instrument, type Market, type Timeframe } from "@/core/market/types";

export interface MockProviderOptions {
  id?: string;
  name?: string;
  markets?: readonly Market[];
  dataMode?: DataMode;
  instruments?: readonly Instrument[];
  /** Interval between quote updates per subscription, in milliseconds. */
  quoteIntervalMs?: number;
  /** Clock, injectable for tests. */
  now?: () => number;
}

export const MOCK_INSTRUMENTS: readonly Instrument[] = [
  { symbol: "BTCUSDT", name: "Bitcoin", market: "crypto", currency: "USDT", decimals: 2 },
  { symbol: "ETHUSDT", name: "Ethereum", market: "crypto", currency: "USDT", decimals: 2 },
  { symbol: "AAPL", name: "Apple Inc.", market: "us_stock", currency: "USD", decimals: 2 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", market: "etf", currency: "USD", decimals: 2 },
  { symbol: "SAP.DE", name: "SAP SE", market: "de_stock", currency: "EUR", decimals: 2 },
  { symbol: "EUR/USD", name: "Euro / US-Dollar", market: "forex", currency: "USD", decimals: 5 },
];

/**
 * Generates plausible, deterministic market data without any network access.
 * Used during development and in tests until the real adapters exist.
 */
export class MockProvider implements MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly markets: readonly Market[];
  readonly dataMode: DataMode;
  private readonly instruments: readonly Instrument[];
  private readonly quoteIntervalMs: number;
  private readonly now: () => number;

  constructor(options: MockProviderOptions = {}) {
    this.id = options.id ?? "mock";
    this.name = options.name ?? "Testdaten";
    this.markets = options.markets ?? ["crypto", "us_stock", "etf", "de_stock", "forex"];
    this.dataMode = options.dataMode ?? "live";
    this.instruments = (options.instruments ?? MOCK_INSTRUMENTS)
      .filter((i) => this.markets.includes(i.market))
      .map((i) => ({ ...i, providerId: this.id }));
    this.quoteIntervalMs = options.quoteIntervalMs ?? 1000;
    this.now = options.now ?? Date.now;
  }

  async searchInstruments(query: string): Promise<Instrument[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.instruments.filter((i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number): Promise<Candle[]> {
    const step = TIMEFRAME_MS[timeframe];
    const lastOpen = Math.floor(this.now() / step) * step;
    const random = seededRandom(`${symbol}:${timeframe}`);
    const candles: Candle[] = [];
    let close = basePrice(symbol);
    for (let i = limit - 1; i >= 0; i--) {
      const open = close;
      close = open * (1 + (random() - 0.5) * 0.02);
      const high = Math.max(open, close) * (1 + random() * 0.005);
      const low = Math.min(open, close) * (1 - random() * 0.005);
      candles.push({ time: lastOpen - i * step, open, high, low, close, volume: Math.round(random() * 1000) });
    }
    return candles;
  }

  subscribeQuotes(symbols: readonly string[], onQuote: QuoteListener): Unsubscribe {
    const state = symbols.map((symbol) => ({ symbol, base: basePrice(symbol), price: basePrice(symbol), random: seededRandom(symbol) }));
    const timer = setInterval(() => {
      for (const s of state) {
        s.price *= 1 + (s.random() - 0.5) * 0.002;
        onQuote({
          symbol: s.symbol,
          price: s.price,
          changePercent: ((s.price - s.base) / s.base) * 100,
          timestamp: this.now(),
          dataMode: this.dataMode,
        });
      }
    }, this.quoteIntervalMs);
    return () => clearInterval(timer);
  }
}

/** Stable start price per symbol between 10 and 1010. */
function basePrice(symbol: string): number {
  return 10 + (hash(symbol) % 100_000) / 100;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: small deterministic PRNG, returns values in [0, 1). */
function seededRandom(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
