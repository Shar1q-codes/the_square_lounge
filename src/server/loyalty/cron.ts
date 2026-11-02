import { timingSafeEqual } from "node:crypto";

/** The scheduled function sends `Authorization: Bearer <CRON_SECRET>`. No secret configured means no access. */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
