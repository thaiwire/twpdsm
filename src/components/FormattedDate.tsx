/**
 * Renders a date as dd/mm/yyyy (Gregorian / ค.ศ.), fixed regardless of locale.
 * Uses UTC getters because document dates are stored as UTC midnight (parsed
 * from a plain "YYYY-MM-DD" <input type="date"> value) — local-time getters
 * would shift the displayed day in timezones behind UTC.
 */
export function FormattedDate({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();

  return (
    <>
      {dd}/{mm}/{yyyy}
    </>
  );
}
