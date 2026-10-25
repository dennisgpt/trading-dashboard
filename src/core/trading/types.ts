// Paper trading types. See docs/datenmodell.md.
import type { DataMode, Instrument } from "@/core/market/types";
import type { MinorUnits } from "@/lib/money";

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus = "open" | "filled" | "cancelled" | "rejected";
export type PositionSide = "long" | "short";

/** Simulated account. Amounts are integers in the minor unit of `currency` (cents). */
export interface PaperAccount {
  id: string;
  name: string;
  /** ISO 4217 code, e.g. "USD". All bookings are converted into this currency. */
  currency: string;
  startingCapital: MinorUnits;
  cash: MinorUnits;
  /** Unix epoch in milliseconds. */
  createdAt: number;
}

interface OrderBase {
  id: string;
  accountId: string;
  instrument: Instrument;
  side: OrderSide;
  /** Units of the instrument, always positive. Fractions are allowed (e.g. 0.015 BTC). */
  quantity: number;
  status: OrderStatus;
  createdAt: number;
  /** Data mode of the price the order was placed on; orders on delayed prices are flagged in the UI. */
  dataMode: DataMode;
  filledAt?: number;
  fillPrice?: number;
  rejectReason?: string;
}

export interface MarketOrder extends OrderBase {
  type: "market";
}

export interface LimitOrder extends OrderBase {
  type: "limit";
  limitPrice: number;
}

export type Order = MarketOrder | LimitOrder;

/** Open position per account and instrument. */
export interface Position {
  accountId: string;
  instrument: Instrument;
  side: PositionSide;
  /** Always positive; `side` gives the direction. */
  quantity: number;
  /** Volume-weighted entry price in the instrument's currency. */
  averagePrice: number;
  openedAt: number;
}

/** One execution. A fill of an order creates exactly one trade. */
export interface Trade {
  id: string;
  orderId: string;
  accountId: string;
  instrument: Instrument;
  side: OrderSide;
  quantity: number;
  price: number;
  /** Simulated fee in the account currency. */
  fee: MinorUnits;
  /** Realized profit or loss when the trade reduces or closes a position. */
  realizedPnl?: MinorUnits;
  timestamp: number;
  dataMode: DataMode;
}
