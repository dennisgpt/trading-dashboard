// Money amounts of the paper account are stored as integers in the currency's minor unit
// (cents) so that bookings never accumulate floating point errors. Prices and quantities
// stay plain numbers; they are only converted when an amount is booked.

/** Integer amount in the minor unit of a currency, e.g. 1234 = 12.34 USD. */
export type MinorUnits = number;

/** Decimals of the minor unit. Every currency used so far has 2. */
export const MINOR_UNIT_DECIMALS = 2;
const FACTOR = 10 ** MINOR_UNIT_DECIMALS;

/** Converts a decimal amount to minor units, rounding half away from zero. */
export function toMinorUnits(amount: number): MinorUnits {
  const scaled = Math.round(Math.abs(amount) * FACTOR + Number.EPSILON * FACTOR);
  return amount < 0 ? -scaled : scaled;
}

export function fromMinorUnits(amount: MinorUnits): number {
  return amount / FACTOR;
}

/** Value of `quantity` units at `price`, in minor units. */
export function tradeValue(price: number, quantity: number): MinorUnits {
  return toMinorUnits(price * quantity);
}
