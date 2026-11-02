/** Pure helpers for play sessions, safe to use in client components. */

export const PAYMENT_METHODS = ["cash", "upi", "card", "other"] as const;

export const VOID_WINDOW_MS = 15 * 60 * 1000;
export const LONG_SESSION_MS = 12 * 60 * 60 * 1000;
export const MAX_CORRECTED_MS = 24 * 60 * 60 * 1000;

const IST_OFFSET = "+05:30";

/** Whole minutes played, rounded down and never negative. */
export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60_000));
}

/** Staff may void a check-in up to and including 15 minutes after it started. */
export const canVoid = (startedAt: Date, now: Date) => now.getTime() - startedAt.getTime() <= VOID_WINDOW_MS;

/** Open for more than 12 hours: probably a forgotten check-out. */
export const needsAttention = (startedAt: Date, now: Date) => now.getTime() - startedAt.getTime() > LONG_SESSION_MS;

/** "2 h 5 min", "45 min", "1 h". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Rupees typed by staff ("150", "150.50") to paise. Empty means "not recorded". Max ₹9,99,999.99. */
export function parseRupees(raw: string): { ok: true; paise: number | null } | { ok: false } {
  const value = raw.trim();
  if (value === "") return { ok: true, paise: null };
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(value);
  if (!match) return { ok: false };
  return { ok: true, paise: Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0")) };
}

/** "₹1,250" or "₹150.50" in Indian grouping. */
export function formatRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);
}

/** Reads an <input type="datetime-local"> value as India time. */
export function parseIstInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${IST_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A date as an India-time datetime-local value, e.g. "2026-11-03T16:10". */
export function istInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "4:10 pm" in India time. */
export const istTime = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(date);

/** "3 Nov, 4:10 pm" in India time. */
export const istDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
