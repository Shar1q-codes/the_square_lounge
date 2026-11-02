import { z } from "zod";
import { normaliseEmail } from "@/server/identity/email";
import { normalisePhone } from "@/server/identity/phone";

export const GENDERS = ["male", "female", "other", "prefer_not"] as const;
export const REFERRAL_SOURCES = ["instagram", "google", "friend", "walk_in", "whatsapp", "other"] as const;
export const STAFF_ROLES = ["staff", "admin"] as const;

export const MIN_AGE = 13;
export const ADULT_AGE = 18;

/** HTML checkboxes send "on" when ticked and nothing when not. */
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" || v === undefined ? null : v), schema.nullable());

export const emailField = z
  .string()
  .transform((v, ctx) => normaliseEmail(v) ?? (ctx.addIssue({ code: "custom", message: "Enter a valid email address." }), z.NEVER));

export const phoneField = z
  .string()
  .transform(
    (v, ctx) =>
      normalisePhone(v) ?? (ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian mobile number." }), z.NEVER),
  );

export const passwordField = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128, "Use at most 128 characters.");

const profileFields = (currentYear: number) => ({
  fullName: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailField,
  phone: phoneField,
  birthYear: z.coerce
    .number({ error: "Enter your birth year." })
    .int()
    .min(currentYear - 100, "Enter a real birth year.")
    .max(currentYear - MIN_AGE, `You need to be at least ${MIN_AGE} to join.`),
  gender: optional(z.enum(GENDERS)),
  area: z.string().trim().min(2, "Enter your area, e.g. Malakpet.").max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode."),
  referralSource: z.enum(REFERRAL_SOURCES, { error: "Tell us how you found us." }),
  favouriteGames: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean)
        .slice(0, 10)
        .map((g) => g.slice(0, 60)),
    ),
});

/**
 * Only the birth year is known, so age is approximate: someone born in `currentYear - 18`
 * may still be 17, so they are asked for guardian consent too (DPDP: under-18s need it).
 */
export const mayBeMinor = (birthYear: number, currentYear: number) => currentYear - birthYear <= ADULT_AGE;

export const signUpSchema = (currentYear: number) =>
  z
    .object({
      ...profileFields(currentYear),
      password: passwordField,
      marketingOptIn: checkbox,
      guardianConsent: checkbox,
      agreeTerms: checkbox.refine((v) => v, "Please agree to the privacy notice to continue."),
    })
    .superRefine((data, ctx) => {
      if (mayBeMinor(data.birthYear, currentYear) && !data.guardianConsent) {
        ctx.addIssue({
          code: "custom",
          path: ["guardianConsent"],
          message: "If you're under 18, a parent or guardian must agree.",
        });
      }
    });

export type SignUpInput = z.output<ReturnType<typeof signUpSchema>>;

export const profileSchema = (currentYear: number) => z.object(profileFields(currentYear));
export type ProfileInput = z.output<ReturnType<typeof profileSchema>>;

export const gamerLoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email."),
  password: z.string().min(1, "Enter your password."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: passwordField,
});

export const staffLoginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

export const createStaffSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,32}$/, "3–32 characters: letters, numbers, dots or underscores."),
  displayName: z.string().trim().min(2, "Enter a display name.").max(60),
  role: z.enum(STAFF_ROLES),
  password: passwordField,
});

/** Turns zod issues into { field: firstMessage } for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}
