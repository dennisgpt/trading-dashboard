// Conversions between Binance payloads and our market data types.
// API reference: https://developers.binance.com/docs/binance-spot-api-docs
import type { Candle, Instrument, Quote, Timeframe } from "@/core/market/types";

export const BINANCE_PROVIDER_ID = "binance";

export const BINANCE_INTERVALS: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1H": "1h",
  "4H": "4h",
  "1D": "1d",
  "1W": "1w",
};

/** Quote assets offered in the search, in order of preference. */
export const QUOTE_ASSETS = ["USDT", "USDC", "EUR", "BTC"] as const;

/** Display names for common coins; Binance's public API only knows the ticker symbol. */
const COIN_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  BNB: "BNB",
  XRP: "XRP",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  TRX: "TRON",
  DOT: "Polkadot",
  AVAX: "Avalanche",
  LINK: "Chainlink",
  LTC: "Litecoin",
  BCH: "Bitcoin Cash",
  XLM: "Stellar",
  ATOM: "Cosmos",
  UNI: "Uniswap",
  NEAR: "NEAR Protocol",
  APT: "Aptos",
  ARB: "Arbitrum",
  OP: "Optimism",
  SUI: "Sui",
  TON: "Toncoin",
  PEPE: "Pepe",
  SHIB: "Shiba Inu",
  FIL: "Filecoin",
  ETC: "Ethereum Classic",
  AAVE: "Aave",
  POL: "Polygon",
};

/** [openTime, open, high, low, close, volume, closeTime, ...] as returned by /api/v3/klines */
export type RawKline = [number, string, string, string, string, string, number, ...unknown[]];

export function klineToCandle(k: RawKline): Candle {
  return { time: k[0], open: Number(k[1]), high: Number(k[2]), low: Number(k[3]), close: Number(k[4]), volume: Number(k[5]) };
}

/** `k` object of a kline stream event */
export interface KlineEvent {
  k: { t: number; o: string; h: string; l: string; c: string; v: string };
}

export function klineEventToCandle({ k }: KlineEvent): Candle {
  return { time: k.t, open: Number(k.o), high: Number(k.h), low: Number(k.l), close: Number(k.c), volume: Number(k.v) };
}

/** 24hr ticker stream event (`<symbol>@ticker`) */
export interface TickerEvent {
  E: number;
  s: string;
  c: string;
  P: string;
  h: string;
  l: string;
}

export function tickerToQuote(t: TickerEvent): Quote {
  return {
    symbol: t.s,
    price: Number(t.c),
    changePercent: Number(t.P),
    high: Number(t.h),
    low: Number(t.l),
    timestamp: t.E,
    dataMode: "live",
  };
}

/** Splits "BTCUSDT" into base and quote asset for the supported quote assets. */
export function splitSymbol(symbol: string): { base: string; quote: string } | null {
  for (const quote of QUOTE_ASSETS) {
    if (symbol.endsWith(quote) && symbol.length > quote.length) {
      return { base: symbol.slice(0, -quote.length), quote };
    }
  }
  return null;
}

/** Display decimals derived from the price level: 2 for large prices, more for small ones. */
export function decimalsForPrice(price: number): number {
  if (!(price > 0)) return 2;
  if (price >= 100) return 2;
  if (price >= 1) return 4;
  return Math.min(8, Math.ceil(-Math.log10(price)) + 3);
}

export function toInstrument(symbol: string, price: number): Instrument | null {
  const parts = splitSymbol(symbol);
  if (!parts) return null;
  return {
    symbol,
    displaySymbol: `${parts.base}/${parts.quote}`,
    name: COIN_NAMES[parts.base] ?? parts.base,
    market: "crypto",
    currency: parts.quote,
    decimals: decimalsForPrice(price),
    providerId: BINANCE_PROVIDER_ID,
  };
}
