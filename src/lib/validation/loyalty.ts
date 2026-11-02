import { z } from "zod";
import { parseIstInput } from "@/lib/sessions";

export const OFFER_CATEGORIES = ["gaming", "cafe", "other"] as const;

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

const optionalCount = (min: number, message: string) =>
  z.preprocess(blankToNull, z.coerce.number({ error: message }).int(message).min(min, message).nullable());

const optionalIst = z.preprocess(
  blankToNull,
  z
    .string()
    .nullable()
    .transform((v, ctx) => {
      if (v === null) return null;
      const date = parseIstInput(v);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Enter a date and time." });
        return z.NEVER;
      }
      return date;
    }),
);

export const offerSchema = z
  .object({
    title: z.string().trim().min(2, "Give the offer a name.").max(80),
    description: z.string().trim().max(300).default(""),
    pointsCost: z.coerce.number({ error: "Enter the points cost." }).int("Whole points only.").min(1, "At least 1 point.").max(100_000),
    category: z.enum(OFFER_CATEGORIES),
    stock: optionalCount(0, "Leave blank for unlimited, or enter 0 or more."),
    maxPerGamer: optionalCount(1, "Leave blank for no limit, or enter 1 or more."),
    startsAt: optionalIst,
    endsAt: optionalIst,
    active: z.preprocess((v) => v === "on" || v === true, z.boolean()),
  })
  .superRefine((v, ctx) => {
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "The end must be after the start." });
    }
  });

export const adjustmentSchema = z.object({
  gamerId: z.uuid(),
  points: z.coerce
    .number({ error: "Enter a whole number, e.g. 50 or -50." })
    .int("Whole points only.")
    .min(-10_000, "At most 10,000 at a time.")
    .max(10_000, "At most 10,000 at a time.")
    .refine((v) => v !== 0, "Enter a number other than 0."),
  reason: z.string().trim().min(3, "Give a reason.").max(200),
});
