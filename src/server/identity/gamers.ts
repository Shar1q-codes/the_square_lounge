import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import QRCode from "qrcode";
import { db, schema } from "@/db";
import type { Gamer } from "@/db/schema";
import { PRIVACY_NOTICE_VERSION } from "@/config/privacy";
import { mayBeMinor, type ProfileInput, type SignUpInput } from "@/lib/validation/identity";
import { normaliseEmail } from "./email";
import { isLockedOut, recordLoginAttempt } from "./lockout";
import { generateMemberCode } from "./memberCode";
import { hashPassword, verifyPassword } from "./password";
import { revokeGamerSessions } from "./session";

export type LoginResult = { ok: true; gamerId: string } | { ok: false; reason: "invalid" | "locked" };

// Checked when the email is unknown, so both cases take about as long.
let dummyHash: Promise<string> | undefined;

/** Checks a gamer's email and password, applying the 5-in-15-minutes lockout. */
export async function verifyGamerLogin(rawEmail: string, password: string): Promise<LoginResult> {
  const email = normaliseEmail(rawEmail);
  if (!email) return { ok: false, reason: "invalid" };
  if (await isLockedOut("gamer", email)) return { ok: false, reason: "locked" };

  const [gamer] = await db
    .select({ id: schema.gamers.id, passwordHash: schema.gamers.passwordHash })
    .from(schema.gamers)
    .where(and(eq(schema.gamers.email, email), isNull(schema.gamers.deletedAt)))
    .limit(1);

  dummyHash ??= hashPassword("timing-equaliser");
  const ok = await verifyPassword(password, gamer?.passwordHash ?? (await dummyHash));
  const succeeded = ok && !!gamer;
  await recordLoginAttempt("gamer", email, succeeded);
  return succeeded ? { ok: true, gamerId: gamer.id } : { ok: false, reason: "invalid" };
}

/** Postgres unique-violation on a given constraint (Drizzle wraps driver errors in `cause`). */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  for (let e = error as { code?: string; constraint_name?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505" && e.constraint_name === constraint) return true;
  }
  return false;
}

export type RegisterResult = { ok: true; gamer: Gamer } | { ok: false; reason: "email_taken" };

/** Creates the gamer and their consent rows in one transaction. */
export async function registerGamer(input: SignUpInput): Promise<RegisterResult> {
  const passwordHash = await hashPassword(input.password);

  // A member-code clash is unlikely (31^5 codes) but possible, so retry with a new one.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const gamer = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(schema.gamers)
          .values({
            memberCode: generateMemberCode(),
            email: input.email,
            passwordHash,
            fullName: input.fullName,
            phone: input.phone,
            birthYear: input.birthYear,
            gender: input.gender,
            area: input.area,
            pincode: input.pincode,
            referralSource: input.referralSource,
            favouriteGames: input.favouriteGames,
            marketingOptIn: input.marketingOptIn,
          })
          .returning();

        const purposes = [
          "service" as const,
          ...(input.marketingOptIn ? ["marketing" as const] : []),
          ...(input.guardianConsent ? ["guardian" as const] : []),
        ];
        await tx.insert(schema.consents).values(
          purposes.map((purpose) => ({
            gamerId: created.id,
            purpose,
            granted: true,
            noticeVersion: PRIVACY_NOTICE_VERSION,
          })),
        );
        return created;
      });
      return { ok: true, gamer };
    } catch (error) {
      if (isUniqueViolation(error, "gamers_email_unique")) return { ok: false, reason: "email_taken" };
      if (!isUniqueViolation(error, "gamers_member_code_unique")) throw error;
    }
  }
  throw new Error("Could not generate a unique member code");
}

export type ProfileResult = { ok: true } | { ok: false; reason: "email_taken" | "guardian_needed" };

/** Saves profile edits. A birth year that makes the gamer a possible minor needs guardian consent on file. */
export async function updateGamerProfile(gamerId: string, input: ProfileInput, currentYear: number): Promise<ProfileResult> {
  if (mayBeMinor(input.birthYear, currentYear)) {
    const [guardian] = await db
      .select({ id: schema.consents.id })
      .from(schema.consents)
      .where(and(eq(schema.consents.gamerId, gamerId), eq(schema.consents.purpose, "guardian"), eq(schema.consents.granted, true)))
      .limit(1);
    if (!guardian) return { ok: false, reason: "guardian_needed" };
  }

  try {
    await db
      .update(schema.gamers)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(schema.gamers.id, gamerId), isNull(schema.gamers.deletedAt)));
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error, "gamers_email_unique")) return { ok: false, reason: "email_taken" };
    throw error;
  }
}

/** Changes the password and signs out every session; the caller starts a fresh one. */
export async function changeGamerPassword(
  gamerId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; reason: "wrong_password" }> {
  const [gamer] = await db
    .select({ passwordHash: schema.gamers.passwordHash })
    .from(schema.gamers)
    .where(eq(schema.gamers.id, gamerId))
    .limit(1);
  if (!(await verifyPassword(currentPassword, gamer?.passwordHash))) return { ok: false, reason: "wrong_password" };

  await db
    .update(schema.gamers)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(schema.gamers.id, gamerId));
  await revokeGamerSessions(gamerId);
  return { ok: true };
}

/** QR code staff scan at check-in. */
export function memberQrSvg(memberCode: string): Promise<string> {
  return QRCode.toString(memberCode, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#07070a", light: "#f5f5f7" } });
}
