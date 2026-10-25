import { describe, expect, it } from "vitest";
import { formatChange, formatPercent, formatPrice } from "./format";

// Intl inserts narrow no-break spaces in some locales; normalise for readable expectations.
const plain = (s: string) => s.replace(/[  ]/g, " ");

describe("format", () => {
  it("formats prices with German separators and fixed decimals", () => {
    expect(formatPrice(80397.17, 2)).toBe("80.397,17");
    expect(formatPrice(0.00000812, 8)).toBe("0,00000812");
    expect(formatPrice(1.5, 4)).toBe("1,5000");
  });

  it("formats percentages with sign", () => {
    expect(plain(formatPercent(1.234))).toBe("+1,23 %");
    expect(plain(formatPercent(-0.277))).toBe("−0,28 %");
    expect(plain(formatPercent(0))).toBe("0,00 %");
  });

  it("formats signed changes", () => {
    expect(formatChange(123.456, 2)).toBe("+123,46");
    expect(formatChange(-0.0012, 4)).toBe("−0,0012");
    expect(formatChange(0, 2)).toBe("0,00");
  });
});
