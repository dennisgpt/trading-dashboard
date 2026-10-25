import type { Candle, DataMode, Instrument, Market, Quote, Timeframe } from "./types";

/** Stops a subscription. Calling it more than once has no effect. */
export type Unsubscribe = () => void;

export type QuoteListener = (quote: Quote) => void;

/**
 * One adapter per market data source (Binance, Finnhub, Twelve Data ...).
 * Panels and stores never talk to a source directly, only through this interface (ADR 0003).
 */
export interface MarketDataProvider {
  /** Stable identifier, e.g. "binance". Stored with instruments, so never rename it. */
  readonly id: string;
  /** Display name for the UI, e.g. "Binance". */
  readonly name: string;
  readonly markets: readonly Market[];
  /** Mode of every quote this provider delivers. */
  readonly dataMode: DataMode;

  /** Finds instruments by symbol or name. Returns an empty list when nothing matches. */
  searchInstruments(query: string, signal?: AbortSignal): Promise<Instrument[]>;

  /** Returns the latest `limit` candles, oldest first. The last candle may still be open. */
  getCandles(symbol: string, timeframe: Timeframe, limit: number, signal?: AbortSignal): Promise<Candle[]>;

  /**
   * Streams quotes for the given symbols until the returned function is called.
   * Reconnects on its own; errors are reported through `onError` and do not end the subscription.
   */
  subscribeQuotes(symbols: readonly string[], onQuote: QuoteListener, onError?: (error: Error) => void): Unsubscribe;
}
