import { randomInt } from "node:crypto";

/** No 0/O, 1/I/L: easy to read aloud at the counter. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LENGTH = 5;

export function generateMemberCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `SQ-${code}`;
}

/** Reads a typed or scanned code ("sq 7k2qm", "7K2QM") as SQ-7K2QM, or null if it can't be one. */
export function normaliseMemberCode(raw: string): string | null {
  const body = raw.toUpperCase().replace(/[\s-]/g, "").replace(/^SQ/, "");
  return new RegExp(`^[${ALPHABET}]{${LENGTH}}$`).test(body) ? `SQ-${body}` : null;
}
