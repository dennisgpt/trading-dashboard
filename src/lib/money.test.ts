import { describe, expect, it } from "vitest";
import { fromMinorUnits, toMinorUnits, tradeValue } from "./money";

describe("money", () => {
  it("converts decimal amounts to integer cents", () => {
    expect(toMinorUnits(12.34)).toBe(1234);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(-5.5)).toBe(-550);
  });

  it("rounds half away from zero", () => {
    expect(toMinorUnits(1.005)).toBe(101);
    expect(toMinorUnits(-1.005)).toBe(-101);
    expect(toMinorUnits(2.344)).toBe(234);
  });

  it("converts back to decimal amounts", () => {
    expect(fromMinorUnits(1234)).toBe(12.34);
    expect(fromMinorUnits(-1)).toBe(-0.01);
  });

  it("computes trade values for fractional quantities", () => {
    expect(tradeValue(67_123.45, 0.015)).toBe(100_685);
    expect(tradeValue(1.08745, 10_000)).toBe(1_087_450);
  });
});
