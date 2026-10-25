// Number formatting for the UI (German locale: 1.234,56).

const priceFormats = new Map<number, Intl.NumberFormat>();

/** Price with a fixed number of decimals, e.g. 80.397,17 */
export function formatPrice(value: number, decimals: number): string {
  let format = priceFormats.get(decimals);
  if (!format) {
    format = new Intl.NumberFormat("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    priceFormats.set(decimals, format);
  }
  return format.format(value);
}

const percentFormat = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

/** Percentage with sign, e.g. +1,23 % / −0,28 % / 0,00 % */
export function formatPercent(value: number): string {
  return `${percentFormat.format(value).replace("-", "−")} %`;
}

/** Signed absolute change, e.g. +123,45 / −0,0012 */
export function formatChange(value: number, decimals: number): string {
  const formatted = formatPrice(Math.abs(value), decimals);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

const compactFormat = new Intl.NumberFormat("de-DE", { notation: "compact", maximumFractionDigits: 1 });

/** Large numbers in short form, e.g. 1,2 Mio. */
export function formatCompact(value: number): string {
  return compactFormat.format(value);
}
