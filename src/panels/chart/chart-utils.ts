import type { UTCTimestamp } from "lightweight-charts";

/** Chart times stay in UTC (seconds); only the labels are formatted in local time. */
export function toChartTime(epochMs: number): UTCTimestamp {
  return Math.floor(epochMs / 1000) as UTCTimestamp;
}

const formats = {
  year: new Intl.DateTimeFormat("de-DE", { year: "numeric" }),
  month: new Intl.DateTimeFormat("de-DE", { month: "short" }),
  day: new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "short" }),
  time: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }),
  seconds: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  full: new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }),
};

/**
 * Axis label in local time. `type` follows lightweight-charts' TickMarkType:
 * 0 year, 1 month, 2 day of month, 3 time, 4 time with seconds.
 *
 * Shifting the timestamps by the UTC offset instead would map two UTC hours onto the same local
 * hour on the day daylight saving time ends, which lightweight-charts rejects.
 */
export function formatTickMark(time: number, type: number): string {
  const date = new Date(time * 1000);
  switch (type) {
    case 0:
      return formats.year.format(date);
    case 1:
      return formats.month.format(date);
    case 2:
      return formats.day.format(date);
    case 4:
      return formats.seconds.format(date);
    default:
      return formats.time.format(date);
  }
}

/** Crosshair label in local time. */
export function formatCrosshairTime(time: number): string {
  return formats.full.format(new Date(time * 1000));
}

/** Token colour (#rrggbb or rgba()) with extra transparency, as rgba() that lightweight-charts can parse. */
export function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (hex) return `rgba(${parseInt(hex[1], 16)}, ${parseInt(hex[2], 16)}, ${parseInt(hex[3], 16)}, ${alpha})`;
  const rgba = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(color);
  if (rgba) return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${+(Number(rgba[4] ?? 1) * alpha).toFixed(3)})`;
  return color;
}
