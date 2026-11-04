/** What a server action hands back to its form: per-field errors and the values to refill. */
export type FormState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  /** A success note shown above the form. */
  notice?: string;
};

export const emptyFormState: FormState = {};

/** Submitted text values, minus secrets, so a failed submit can refill the form. */
export function refillValues(formData: FormData, secrets: string[] = []): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$") && !secrets.includes(key)) values[key] = value;
  }
  return values;
}

/** Venue-local calendar year (Asia/Kolkata), used for age checks. */
export function venueYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now));
}

/** Pages a login may send the gamer back to. Anything else goes to the account page. */
const RETURN_PAGES = ["/order", "/shop", "/account"];

/** Where to go after logging in: the requested page only if it is one of ours. */
export function afterLogin(next: unknown): string {
  return typeof next === "string" && RETURN_PAGES.includes(next) ? next : "/account";
}
