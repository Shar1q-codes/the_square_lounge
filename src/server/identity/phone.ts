/**
 * Normalises an Indian mobile number to +91XXXXXXXXXX, or returns null if it isn't one.
 * Accepts spaces, dashes, brackets and a +91 / 91 / 0 prefix. Contact info only: never a login.
 */
export function normalisePhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
