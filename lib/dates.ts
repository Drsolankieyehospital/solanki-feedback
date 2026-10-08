/**
 * IST (Asia/Kolkata) date helpers. All "today" / date logic in the app and
 * reports uses this zone so the hospital office sees consistent dates.
 */
const IST = "Asia/Kolkata";

/** Today in IST as an ISO date string (YYYY-MM-DD). */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** A date N days before today (IST), as YYYY-MM-DD. */
export function daysAgoIST(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Format a timestamp for display in IST, e.g. "8 Oct 2026, 4:12 PM". */
export function formatIST(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
