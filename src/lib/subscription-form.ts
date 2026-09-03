export function toLocalDateInput(date = new Date()): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseSubscriptionForm(monthlyFee: string, startedAt: string) {
  const fee = Number(monthlyFee);
  if (!monthlyFee.trim() || !Number.isFinite(fee) || fee < 0) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) return null;
  const date = new Date(`${startedAt}T00:00:00`);
  // Date normalizes values such as February 30; reject those instead of shifting the date.
  if (Number.isNaN(date.getTime()) || toLocalDateInput(date) !== startedAt)
    return null;
  return { monthlyFee: fee, startedAt: date.toISOString() };
}
