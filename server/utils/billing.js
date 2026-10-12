/** Pure billing logic (no DB) so it can be unit-tested. */
export const MS_PER_MINUTE = 60000;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Billable minutes = ceil(elapsed minutes), minimum 1. */
export function billableMinutes(startMs, endMs) {
  const elapsed = Math.max(0, endMs - startMs);
  return Math.max(1, Math.ceil(elapsed / MS_PER_MINUTE));
}

export function computeCharges({ arrivalAt, endAt, ratePerMinute, convenienceFee = 0, discount = 0 }) {
  const minutes = billableMinutes(new Date(arrivalAt).getTime(), new Date(endAt).getTime());
  const parkingCharge = round2(minutes * ratePerMinute);
  const fee = round2(convenienceFee);
  const disc = round2(Math.min(discount, parkingCharge + fee));
  const finalAmount = round2(parkingCharge + fee - disc);
  return { billableMinutes: minutes, parkingCharge, convenienceFee: fee, discount: disc, finalAmount };
}
