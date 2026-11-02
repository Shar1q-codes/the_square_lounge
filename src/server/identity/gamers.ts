import "server-only";
import { db, schema } from "@/db";
import type { Gamer } from "@/db/schema";
import { PRIVACY_NOTICE_VERSION } from "@/config/privacy";
import type { SignUpInput } from "@/lib/validation/identity";
import { generateMemberCode } from "./memberCode";
import { hashPassword } from "./password";

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
