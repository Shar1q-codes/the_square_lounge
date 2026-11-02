/**
 * Pure analytics helpers. The lounge is open 11:00–04:00 IST, so a "business day" runs 04:00 → 04:00:
 * a 01:30 Saturday visit belongs to Friday night.
 */

export const DAY_START_HOUR = 4;
const IST_OFFSET_MS = 5.5 * 3_600_000;
const DAY_MS = 86_400_000;
const MAX_CUSTOM_DAYS = 366;

export const PRESETS = { "7d": 7, "30d": 30, "90d": 90 } as const;
export type RangeKey = keyof typeof PRESETS | "custom";

export type Range = {
  key: RangeKey;
  /** First and last business dates included, YYYY-MM-DD. */
  fromDate: string;
  toDate: string;
  days: number;
  /** [from, to) as instants: 04:00 IST on fromDate to 04:00 IST the day after toDate. */
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
};

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const dateMs = (date: string) => Date.parse(`${date}T00:00:00Z`);
/** 04:00 IST on a business date, as an instant. */
const dayStart = (date: string) => new Date(dateMs(date) + DAY_START_HOUR * 3_600_000 - IST_OFFSET_MS);

/** The business date (YYYY-MM-DD) an instant falls in. */
export function businessDate(at: Date): string {
  return isoDate(at.getTime() + IST_OFFSET_MS - DAY_START_HOUR * 3_600_000);
}

function build(key: RangeKey, fromDate: string, toDate: string): Range {
  const days = Math.round((dateMs(toDate) - dateMs(fromDate)) / DAY_MS) + 1;
  const from = dayStart(fromDate);
  const to = new Date(dayStart(toDate).getTime() + DAY_MS);
  return { key, fromDate, toDate, days, from, to, previousFrom: new Date(from.getTime() - days * DAY_MS), previousTo: from };
}

/** Turns URL parameters into a date range. Anything invalid falls back to the last 7 days. */
export function resolveRange(params: { range?: string; from?: string; to?: string }, now = new Date()): Range {
  const today = businessDate(now);
  const preset = (n: number, key: RangeKey) => build(key, isoDate(dateMs(today) - (n - 1) * DAY_MS), today);

  if (params.range === "custom") {
    const valid = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(dateMs(d));
    if (valid(params.from) && valid(params.to)) {
      const span = (dateMs(params.to!) - dateMs(params.from!)) / DAY_MS + 1;
      if (span >= 1 && span <= MAX_CUSTOM_DAYS && params.to! <= today) return build("custom", params.from!, params.to!);
    }
    return preset(7, "7d");
  }
  if (params.range && params.range in PRESETS) {
    const key = params.range as keyof typeof PRESETS;
    return preset(PRESETS[key], key);
  }
  return preset(7, "7d");
}

/** Percentage change, rounded to a whole number. null when there's nothing to compare with. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * One CSV line. Text starting with = + - @ (or tab/CR) gets a leading apostrophe so Excel and
 * Google Sheets treat it as text, not a formula.
 */
export function csvRow(values: (string | number | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return "";
      if (typeof v === "number") return String(v);
      const text = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
      return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    })
    .join(",");
}

/** 0 (none) to 4 (busiest) for shading a heatmap cell. */
export function heatLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || max <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) as 1 | 2 | 3 | 4;
}

/** Hours shown on the heatmap: opening (11:00) through the last hour before closing (03:00). */
export const HEATMAP_HOURS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3] as const;
export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** "11 am", "12 pm", "1 am". */
export const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "am" : "pm"}`;
