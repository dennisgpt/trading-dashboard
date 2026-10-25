import type { CandleListener, MarketDataProvider, QuoteListener, Unsubscribe } from "@/core/market/provider";
import type { Candle, ConnectionStatus, Instrument, Market, Timeframe } from "@/core/market/types";
import {
  BINANCE_INTERVALS,
  BINANCE_PROVIDER_ID,
  QUOTE_ASSETS,
  klineEventToCandle,
  klineToCandle,
  splitSymbol,
  tickerToQuote,
  toInstrument,
  type KlineEvent,
  type RawKline,
  type TickerEvent,
} from "./binance-mappers";
import { BinanceStream, type SocketFactory } from "./binance-stream";

/** Market-data-only endpoints: public, no API key, not geo-restricted like api.binance.com. */
export const BINANCE_REST_URL = "https://data-api.binance.vision";
export const BINANCE_STREAM_URL = "wss://data-stream.binance.vision/stream";

const MAX_KLINES = 1000;
const MAX_SEARCH_RESULTS = 20;

export interface BinanceProviderOptions {
  restUrl?: string;
  streamUrl?: string;
  fetch?: typeof fetch;
  createSocket?: SocketFactory;
  random?: () => number;
}

/** Crypto prices from Binance: REST for candles and search, one shared WebSocket for live data. */
export class BinanceProvider implements MarketDataProvider {
  readonly id = BINANCE_PROVIDER_ID;
  readonly name = "Binance";
  readonly markets: readonly Market[] = ["crypto"];
  readonly dataMode = "live" as const;

  private readonly restUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly stream: BinanceStream;
  private symbolList: Promise<Instrument[]> | null = null;

  constructor(options: BinanceProviderOptions = {}) {
    this.restUrl = options.restUrl ?? BINANCE_REST_URL;
    // Bound so that the global fetch keeps its `this`.
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.stream = new BinanceStream({
      url: options.streamUrl ?? BINANCE_STREAM_URL,
      createSocket: options.createSocket,
      random: options.random,
    });
  }

  async searchInstruments(query: string, signal?: AbortSignal): Promise<Instrument[]> {
    const q = query.trim().toUpperCase().replace(/[\s/-]/g, "");
    if (!q) return [];
    const all = await this.allInstruments(signal);
    const rank = (i: Instrument): number => {
      const base = splitSymbol(i.symbol)?.base ?? i.symbol;
      const quoteRank = QUOTE_ASSETS.indexOf(i.currency as (typeof QUOTE_ASSETS)[number]);
      if (i.symbol === q) return quoteRank;
      if (base === q) return 10 + quoteRank;
      if (i.symbol.startsWith(q)) return 20 + quoteRank;
      return 30 + quoteRank;
    };
    return all
      .filter((i) => i.symbol.includes(q) || i.name.toUpperCase().includes(q))
      .sort((a, b) => rank(a) - rank(b) || a.symbol.localeCompare(b.symbol))
      .slice(0, MAX_SEARCH_RESULTS);
  }

  async getCandles(symbol: string, timeframe: Timeframe, limit: number, signal?: AbortSignal): Promise<Candle[]> {
    const params = new URLSearchParams({
      symbol,
      interval: BINANCE_INTERVALS[timeframe],
      limit: String(Math.min(Math.max(limit, 1), MAX_KLINES)),
    });
    const rows = await this.getJson<RawKline[]>(`/api/v3/klines?${params}`, signal);
    return rows.map(klineToCandle);
  }

  subscribeQuotes(symbols: readonly string[], onQuote: QuoteListener): Unsubscribe {
    const unsubscribers = [...new Set(symbols)].map((symbol) =>
      this.stream.subscribe(`${symbol.toLowerCase()}@ticker`, (data) => onQuote(tickerToQuote(data as TickerEvent))),
    );
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }

  subscribeCandles(symbol: string, timeframe: Timeframe, onCandle: CandleListener): Unsubscribe {
    const stream = `${symbol.toLowerCase()}@kline_${BINANCE_INTERVALS[timeframe]}`;
    return this.stream.subscribe(stream, (data) => onCandle(klineEventToCandle(data as KlineEvent)));
  }

  subscribeStatus(listener: (status: ConnectionStatus) => void): Unsubscribe {
    return this.stream.onStatus(listener);
  }

  /** All tradable pairs with a supported quote asset, loaded once (≈160 kB) and cached. */
  private allInstruments(signal?: AbortSignal): Promise<Instrument[]> {
    if (!this.symbolList) {
      this.symbolList = this.getJson<{ symbol: string; price: string }[]>("/api/v3/ticker/price", signal)
        .then((rows) =>
          rows
            .filter((r) => Number(r.price) > 0)
            .map((r) => toInstrument(r.symbol, Number(r.price)))
            .filter((i): i is Instrument => i !== null),
        )
        .catch((error: unknown) => {
          this.symbolList = null;
          throw error;
        });
    }
    return this.symbolList;
  }

  private async getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await this.fetchImpl(`${this.restUrl}${path}`, { signal });
    if (!response.ok) {
      throw new Error(`Binance request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }
}
