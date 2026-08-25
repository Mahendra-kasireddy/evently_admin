/** Formatting helpers. Kept out of the component file so fast refresh works. */

/** Dates arrive as ISO strings; an empty one stays empty rather than "Invalid Date". */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMobile(mobile: string): string {
  return mobile ? `+91 ${mobile}` : '—';
}

/** "Not provided" beats an invented placeholder for a field the organizer left blank. */
export function orNotProvided(value: string): string {
  return value.trim() ? value : 'Not provided';
}
