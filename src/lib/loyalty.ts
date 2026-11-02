import { loyalty } from "@/config/loyalty";

/** Pure loyalty helpers, safe to use in client components. */

export const VOUCHER_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const VOUCHER_LENGTH = 6;

/** Points a session earns: whole points only, capped, never negative. */
export function pointsFor(minutes: number, console: "PS5" | "PS4"): number {
  const counted = Math.min(Math.max(minutes, 0), loyalty.maxMinutesPerSession);
  return Math.floor((counted * loyalty.pointsPerHour[console]) / 60);
}

/** Reads a typed or scanned voucher code ("v 7k2 qm4", "7K2QM4") as V-7K2QM4, or null. */
export function normaliseVoucherCode(raw: string): string | null {
  const body = raw.toUpperCase().replace(/[\s-]/g, "").replace(/^V/, "");
  return new RegExp(`^[${VOUCHER_ALPHABET}]{${VOUCHER_LENGTH}}$`).test(body) ? `V-${body}` : null;
}

/** "+15" / "−100" for history lists. */
export const formatPoints = (delta: number) => (delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`);
