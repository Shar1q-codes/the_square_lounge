import { z } from "zod";

const emailFormat = z.email();

/** Trims and lower-cases an email, or returns null if it isn't a valid address. */
export function normaliseEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  return emailFormat.safeParse(email).success ? email : null;
}
