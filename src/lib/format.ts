/**
 * Money. Rupees, whole numbers — every amount in Evently is stored as an
 * integer number of rupees, so nothing here rounds or invents precision.
 */
export function formatINR(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}
