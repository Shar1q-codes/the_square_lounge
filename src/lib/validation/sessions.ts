import { z } from "zod";
import { GAME_IDS } from "@/lib/games";
import { MAX_CORRECTED_MS, PAYMENT_METHODS, parseIstInput, parseRupees } from "@/lib/sessions";

export { PAYMENT_METHODS };

const stationIdField = z.coerce.number({ error: "Pick a station." }).int().positive("Pick a station.");

/** Optional game from the library: "" or an unknown id means "not said". */
export const gameField = z.preprocess((v) => (typeof v === "string" && GAME_IDS.includes(v) ? v : null), z.string().nullable());

export const checkInSchema = z.object({
  query: z.string().trim().min(1, "Enter or scan a member code."),
  stationId: z.preprocess((v) => (v === "" ? undefined : v), stationIdField),
});

const amountField = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const parsed = parseRupees(v ?? "");
    if (!parsed.ok) {
      ctx.addIssue({ code: "custom", message: "Enter an amount in rupees, e.g. 300 or 299.50." });
      return z.NEVER;
    }
    return parsed.paise;
  });

const methodField = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.enum(PAYMENT_METHODS).nullable(),
);

/** Check out one session (`sessionId`) or every open session at a station (`stationId`). */
export const checkOutSchema = z
  .object({
    sessionId: z.uuid().optional(),
    stationId: z.preprocess((v) => (v === "" ? undefined : v), stationIdField.optional()),
    amount: amountField,
    method: methodField,
  })
  .transform((v, ctx) => {
    const target = v.sessionId ? { sessionId: v.sessionId } : v.stationId ? { stationId: v.stationId } : null;
    if (!target) {
      ctx.addIssue({ code: "custom", message: "Nothing to check out." });
      return z.NEVER;
    }
    return { target, amountPaise: v.amount, method: v.method };
  });

export const voidSchema = z.object({
  sessionId: z.uuid(),
  reason: z.string().trim().min(3, "Say why, e.g. \"wrong station\".").max(200),
});

const istField = (label: string) =>
  z.string().transform((v, ctx) => {
    const date = parseIstInput(v);
    if (!date) {
      ctx.addIssue({ code: "custom", message: `Enter the ${label} date and time.` });
      return z.NEVER;
    }
    return date;
  });

/** Admin fix of a session's times. "Not in the future" is checked against the database clock. */
export const correctionSchema = z
  .object({
    sessionId: z.uuid(),
    startedAt: istField("start"),
    endedAt: istField("end"),
    reason: z.string().trim().min(5, "Give a reason (at least 5 characters).").max(300),
  })
  .superRefine((v, ctx) => {
    const length = v.endedAt.getTime() - v.startedAt.getTime();
    if (length <= 0) ctx.addIssue({ code: "custom", path: ["endedAt"], message: "The end must be after the start." });
    else if (length > MAX_CORRECTED_MS)
      ctx.addIssue({ code: "custom", path: ["endedAt"], message: "A session can't be longer than 24 hours." });
  });
