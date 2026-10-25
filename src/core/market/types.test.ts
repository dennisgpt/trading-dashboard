import { describe, expect, it } from "vitest";
import { instrumentKey, type Instrument } from "./types";

const aapl: Instrument = { symbol: "AAPL", name: "Apple Inc.", market: "us_stock", currency: "USD", decimals: 2 };

describe("instrumentKey", () => {
  it("uses the provider id when set", () => {
    expect(instrumentKey({ ...aapl, providerId: "finnhub" })).toBe("finnhub:AAPL");
  });

  it("falls back to the market", () => {
    expect(instrumentKey(aapl)).toBe("us_stock:AAPL");
  });
});
