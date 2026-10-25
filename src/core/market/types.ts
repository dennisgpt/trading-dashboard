// Market data types shared by providers, stores and panels.
// See docs/datenmodell.md for the full data model.

/** Whether a price is streamed in real time or delayed by the source. */
export type DataMode = "live" | "delayed";

export type Market = "crypto" | "us_stock" | "etf" | "de_stock" | "forex";

export type Timeframe = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W";

/** Duration of one candle per timeframe, in milliseconds. */
export const TIMEFRAME_MS: Record<Timeframe, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1H": 60 * 60_000,
  "4H": 4 * 60 * 60_000,
  "1D": 24 * 60 * 60_000,
  "1W": 7 * 24 * 60 * 60_000,
};

export interface Instrument {
  /** Symbol as used by the data source, e.g. "BTCUSDT", "AAPL", "SAP.DE", "EUR/USD". */
  symbol: string;
  name: string;
  market: Market;
  /** ISO 4217 code of the quote currency, e.g. "USD", "EUR", "USDT". */
  currency: string;
  /** Number of decimals used to display prices. */
  decimals: number;
  /** Provider that serves this instrument. Unset means: let the registry pick one for the market. */
  providerId?: string;
}

export interface Quote {
  symbol: string;
  price: number;
  /** Change against the previous close (or 24h ago for crypto), in percent. */
  changePercent: number;
  /** Time of the price at the source, Unix epoch in milliseconds. */
  timestamp: number;
  dataMode: DataMode;
}

export interface Candle {
  /** Open time of the candle, Unix epoch in milliseconds. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
