import { describe, expect, it } from "vitest";
import { formatTickMark, toChartTime, withAlpha } from "./chart-utils";

describe("withAlpha", () => {
  it("turns hex tokens into rgba", () => {
    expect(withAlpha("#30d158", 0.35)).toBe("rgba(48, 209, 88, 0.35)");
  });

  it("multiplies the alpha of rgba tokens", () => {
    expect(withAlpha("rgba(232, 234, 238, 0.66)", 0.5)).toBe("rgba(232, 234, 238, 0.33)");
    expect(withAlpha("rgb(1, 2, 3)", 0.5)).toBe("rgba(1, 2, 3, 0.5)");
  });

  it("leaves unknown formats untouched", () => {
    expect(withAlpha("red", 0.5)).toBe("red");
  });
});

describe("toChartTime", () => {
  it("keeps UTC seconds, so times stay strictly ascending across the DST change", () => {
    // 2026-10-25: clocks in Germany go back from 03:00 CEST to 02:00 CET
    const hours = [0, 1, 2, 3].map((h) => toChartTime(Date.UTC(2026, 9, 25, h)));
    expect(hours).toEqual([...hours].sort((a, b) => a - b));
    expect(new Set(hours).size).toBe(4);
    expect(hours[0]).toBe(Date.UTC(2026, 9, 25, 0) / 1000);
  });
});

describe("formatTickMark", () => {
  it("formats axis labels per tick type", () => {
    const t = Date.UTC(2026, 0, 15, 12, 0, 0) / 1000;
    expect(formatTickMark(t, 0)).toBe("2026");
    expect(formatTickMark(t, 2)).toMatch(/^15\. Jan/);
    expect(formatTickMark(t, 3)).toMatch(/^\d{2}:00$/);
  });
});
