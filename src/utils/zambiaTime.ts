/**
 * Zambia Time (CAT, UTC+2) utilities.
 * All financial timestamps and date snapshots should use these helpers
 * so they stay accurate regardless of the user's device timezone.
 */

const ZAMBIA_TZ = 'Africa/Lusaka';

/** Returns the current Date object (real time, sourced from device clock). */
export function nowCAT(): Date {
  return new Date();
}

/** Returns today's date in Zambia timezone as YYYY-MM-DD. */
export function todayCAT(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZAMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date()); // en-CA yields YYYY-MM-DD
}

/** Returns the current time in Zambia timezone as HH:MM:SS (24h). */
export function timeCAT(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ZAMBIA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

/** Returns an ISO timestamp anchored to Zambia local time (still encodes the UTC instant). */
export function isoNowCAT(): string {
  return new Date().toISOString();
}

/**
 * True if the given YYYY-MM-DD maturity date has been reached in Zambia time.
 * Compares date strings (date-only, ignoring time) so maturity unlocks at the
 * very start of the maturity day in CAT.
 */
export function isMaturedCAT(maturityDate: string | null | undefined): boolean {
  if (!maturityDate) return false;
  return maturityDate <= todayCAT();
}

/** Days until maturity in Zambia local days. Negative when past. */
export function daysUntilMaturityCAT(maturityDate: string | null | undefined): number | null {
  if (!maturityDate) return null;
  const today = todayCAT();
  const a = new Date(today + 'T00:00:00Z').getTime();
  const b = new Date(maturityDate + 'T00:00:00Z').getTime();
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
}
