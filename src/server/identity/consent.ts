import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PRIVACY_NOTICE_VERSION } from "@/config/privacy";
import { ledgerFor } from "@/server/loyalty/ledger";
import { cancelAllVouchers, vouchersForExport } from "@/server/loyalty/vouchers";
import { ordersForExport } from "@/server/orders/orders";
import { sessionsForExport } from "@/server/sessions/history";
import { writeAudit } from "./audit";
import { verifyPassword } from "./password";

/** Records a marketing yes/no as a new consent row and mirrors it on the profile. */
export async function setMarketingConsent(gamerId: string, granted: boolean) {
  await db.transaction(async (tx) => {
    await tx.insert(schema.consents).values({ gamerId, purpose: "marketing", granted, noticeVersion: PRIVACY_NOTICE_VERSION });
    await tx
      .update(schema.gamers)
      .set({ marketingOptIn: granted, updatedAt: new Date() })
      .where(eq(schema.gamers.id, gamerId));
  });
}

/** Everything we hold about a gamer, for "Download my data". Each module adds its own section. */
export async function exportGamerData(gamerId: string) {
  const [gamer] = await db.select().from(schema.gamers).where(eq(schema.gamers.id, gamerId));
  const consents = await db
    .select({
      purpose: schema.consents.purpose,
      granted: schema.consents.granted,
      noticeVersion: schema.consents.noticeVersion,
      at: schema.consents.createdAt,
    })
    .from(schema.consents)
    .where(eq(schema.consents.gamerId, gamerId))
    .orderBy(asc(schema.consents.createdAt));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...profile } = gamer;
  const [sessions, points, vouchers, cafeOrders] = await Promise.all([
    sessionsForExport(gamerId),
    ledgerFor(gamerId, 10_000),
    vouchersForExport(gamerId),
    ordersForExport(gamerId),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile,
    consents,
    sessions,
    points: points.map(({ delta, description, createdAt }) => ({ delta, description, at: createdAt })).reverse(),
    vouchers,
    cafeOrders,
  };
}

/**
 * Erases personal details and signs the gamer out everywhere. Area, pincode and the row itself
 * stay so anonymous play history and analytics still add up; the email becomes free again.
 */
export async function deleteGamerAccount(
  gamerId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; reason: "wrong_password" }> {
  const [gamer] = await db
    .select({ passwordHash: schema.gamers.passwordHash })
    .from(schema.gamers)
    .where(eq(schema.gamers.id, gamerId));
  if (!(await verifyPassword(password, gamer?.passwordHash))) return { ok: false, reason: "wrong_password" };

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.gamers)
      .set({
        email: null,
        passwordHash: null,
        fullName: null,
        phone: null,
        birthYear: null,
        gender: null,
        favouriteGames: [],
        marketingOptIn: false,
        deletedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.gamers.id, gamerId));
    await tx.delete(schema.authSessions).where(eq(schema.authSessions.gamerId, gamerId));
    await cancelAllVouchers(tx, gamerId);
  });
  await writeAudit({ actorGamerId: gamerId, action: "gamer.delete", targetType: "gamer", targetId: gamerId });
  return { ok: true };
}
