import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, count, desc, eq, gt, inArray, isNull, lte, sql } from "drizzle-orm";
import { db, schema, type Executor } from "@/db";
import { loyalty } from "@/config/loyalty";
import { normaliseVoucherCode, VOUCHER_ALPHABET, VOUCHER_LENGTH } from "@/lib/loyalty";
import { writeAudit } from "@/server/identity/audit";
import { isUniqueViolation } from "@/server/identity/gamers";
import { addLedgerEntry, balanceOf } from "./ledger";

const generateVoucherCode = () =>
  `V-${Array.from({ length: VOUCHER_LENGTH }, () => VOUCHER_ALPHABET[randomInt(VOUCHER_ALPHABET.length)]).join("")}`;

/** Vouchers that count against stock and member limits. */
const HOLDING = ["active", "used"] as const;

export type ClaimResult =
  | { ok: true; voucherId: string; code: string }
  | { ok: false; reason: "not_enough_points"; shortBy: number }
  | { ok: false; reason: "unavailable" | "sold_out" | "limit_reached" | "gamer_not_found" };

/**
 * Spends points on an offer. Locks the member row (so two taps can't overspend) and the offer row
 * (so two members can't take the last one), then writes the voucher and the ledger entry together.
 */
export async function claimOffer(gamerId: string, offerId: string): Promise<ClaimResult> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [gamer] = await tx
          .select({ id: schema.gamers.id })
          .from(schema.gamers)
          .where(and(eq(schema.gamers.id, gamerId), isNull(schema.gamers.deletedAt)))
          .for("update");
        if (!gamer) return { ok: false, reason: "gamer_not_found" } as const;

        const [row] = await tx
          .select({ offer: schema.offers, now: sql<string>`now()` })
          .from(schema.offers)
          .where(eq(schema.offers.id, offerId))
          .for("update");
        const now = row ? new Date(row.now) : new Date();
        const offer = row?.offer;
        if (!offer?.active || (offer.startsAt && offer.startsAt > now) || (offer.endsAt && offer.endsAt <= now)) {
          return { ok: false, reason: "unavailable" } as const;
        }

        if (offer.stock !== null) {
          const [{ taken }] = await tx
            .select({ taken: count() })
            .from(schema.vouchers)
            .where(and(eq(schema.vouchers.offerId, offerId), inArray(schema.vouchers.status, [...HOLDING])));
          if (taken >= offer.stock) return { ok: false, reason: "sold_out" } as const;
        }

        if (offer.maxPerGamer !== null) {
          const [{ mine }] = await tx
            .select({ mine: count() })
            .from(schema.vouchers)
            .where(
              and(
                eq(schema.vouchers.offerId, offerId),
                eq(schema.vouchers.gamerId, gamerId),
                inArray(schema.vouchers.status, [...HOLDING]),
              ),
            );
          if (mine >= offer.maxPerGamer) return { ok: false, reason: "limit_reached" } as const;
        }

        const balance = await balanceOf(gamerId, tx);
        if (balance < offer.pointsCost) return { ok: false, reason: "not_enough_points", shortBy: offer.pointsCost - balance } as const;

        const code = generateVoucherCode();
        const [voucher] = await tx
          .insert(schema.vouchers)
          .values({
            code,
            gamerId,
            offerId,
            pointsSpent: offer.pointsCost,
            expiresAt: sql`now() + ${`${loyalty.voucherDays} days`}::interval`,
          })
          .returning({ id: schema.vouchers.id });
        await addLedgerEntry(tx, { gamerId, delta: -offer.pointsCost, reason: "redemption", voucherId: voucher.id });
        return { ok: true, voucherId: voucher.id, code } as const;
      });
    } catch (error) {
      if (!isUniqueViolation(error, "vouchers_code_unique")) throw error;
    }
  }
  throw new Error("Could not generate a unique voucher code");
}

/** The member gives an unused voucher back and gets the points refunded. */
export async function cancelVoucher(gamerId: string, voucherId: string): Promise<{ ok: true } | { ok: false; reason: "not_active" }> {
  return db.transaction(async (tx) => {
    const [voucher] = await tx
      .update(schema.vouchers)
      .set({ status: "cancelled", updatedAt: sql`now()` })
      .where(and(eq(schema.vouchers.id, voucherId), eq(schema.vouchers.gamerId, gamerId), eq(schema.vouchers.status, "active")))
      .returning();
    if (!voucher) return { ok: false, reason: "not_active" } as const;
    await addLedgerEntry(tx, { gamerId, delta: voucher.pointsSpent, reason: "refund", voucherId, note: "voucher cancelled" });
    return { ok: true } as const;
  });
}

/**
 * Expires active vouchers past their date and refunds them. Safe to run any number of times:
 * the status check in the UPDATE means each voucher is refunded once.
 */
export async function expireOverdueVouchers(): Promise<number> {
  return db.transaction(async (tx) => {
    const expired = await tx
      .update(schema.vouchers)
      .set({ status: "expired", updatedAt: sql`now()` })
      .where(and(eq(schema.vouchers.status, "active"), lte(schema.vouchers.expiresAt, sql`now()`)))
      .returning();
    for (const v of expired) {
      await addLedgerEntry(tx, { gamerId: v.gamerId, delta: v.pointsSpent, reason: "refund", voucherId: v.id, note: "voucher expired" });
    }
    return expired.length;
  });
}

export type MemberVoucher = {
  id: string;
  code: string;
  offerTitle: string;
  offerDescription: string;
  status: "active" | "used" | "expired" | "cancelled";
  pointsSpent: number;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

/** A member's vouchers, newest first, after expiring any that are overdue. */
export async function vouchersFor(gamerId: string): Promise<MemberVoucher[]> {
  await expireOverdueVouchers();
  return db
    .select({
      id: schema.vouchers.id,
      code: schema.vouchers.code,
      offerTitle: schema.offers.title,
      offerDescription: schema.offers.description,
      status: schema.vouchers.status,
      pointsSpent: schema.vouchers.pointsSpent,
      expiresAt: schema.vouchers.expiresAt,
      usedAt: schema.vouchers.usedAt,
      createdAt: schema.vouchers.createdAt,
    })
    .from(schema.vouchers)
    .innerJoin(schema.offers, eq(schema.offers.id, schema.vouchers.offerId))
    .where(eq(schema.vouchers.gamerId, gamerId))
    .orderBy(desc(schema.vouchers.createdAt));
}

export type CounterVoucher = {
  id: string;
  code: string;
  status: MemberVoucher["status"];
  offerTitle: string;
  pointsSpent: number;
  gamerName: string | null;
  memberCode: string;
  expiresAt: Date;
  usedAt: Date | null;
};

/** For the counter: a voucher by its (loosely typed) code, with whose it is. Expires overdue ones first. */
export async function findVoucherForCounter(rawCode: string): Promise<CounterVoucher | null> {
  const code = normaliseVoucherCode(rawCode);
  if (!code) return null;
  await expireOverdueVouchers();
  const [row] = await db
    .select({
      id: schema.vouchers.id,
      code: schema.vouchers.code,
      status: schema.vouchers.status,
      offerTitle: schema.offers.title,
      pointsSpent: schema.vouchers.pointsSpent,
      gamerName: schema.gamers.fullName,
      memberCode: schema.gamers.memberCode,
      expiresAt: schema.vouchers.expiresAt,
      usedAt: schema.vouchers.usedAt,
    })
    .from(schema.vouchers)
    .innerJoin(schema.offers, eq(schema.offers.id, schema.vouchers.offerId))
    .innerJoin(schema.gamers, eq(schema.gamers.id, schema.vouchers.gamerId))
    .where(eq(schema.vouchers.code, code));
  return row ?? null;
}

/** Staff hand over the reward: marks an active, unexpired voucher used. */
export async function redeemVoucher(
  staffId: string,
  voucherId: string,
): Promise<{ ok: true } | { ok: false; status: MemberVoucher["status"] | "not_found" }> {
  await expireOverdueVouchers();
  return db.transaction(async (tx) => {
    const [used] = await tx
      .update(schema.vouchers)
      .set({ status: "used", usedAt: sql`now()`, usedBy: staffId, updatedAt: sql`now()` })
      .where(and(eq(schema.vouchers.id, voucherId), eq(schema.vouchers.status, "active"), gt(schema.vouchers.expiresAt, sql`now()`)))
      .returning({ id: schema.vouchers.id, code: schema.vouchers.code });
    if (!used) {
      const [current] = await tx.select({ status: schema.vouchers.status }).from(schema.vouchers).where(eq(schema.vouchers.id, voucherId));
      return { ok: false, status: current?.status ?? "not_found" } as const;
    }
    await writeAudit({ actorStaffId: staffId, action: "voucher.redeem", targetType: "voucher", targetId: voucherId, details: { code: used.code } }, tx);
    return { ok: true } as const;
  });
}

/** Account deletion: unused vouchers can't be used any more (the points go with the account). */
export async function cancelAllVouchers(tx: Executor, gamerId: string) {
  await tx
    .update(schema.vouchers)
    .set({ status: "cancelled", updatedAt: sql`now()` })
    .where(and(eq(schema.vouchers.gamerId, gamerId), eq(schema.vouchers.status, "active")));
}

/** "Download my data" section. */
export async function vouchersForExport(gamerId: string) {
  const rows = await db
    .select({
      code: schema.vouchers.code,
      offer: schema.offers.title,
      status: schema.vouchers.status,
      pointsSpent: schema.vouchers.pointsSpent,
      claimedAt: schema.vouchers.createdAt,
      expiresAt: schema.vouchers.expiresAt,
      usedAt: schema.vouchers.usedAt,
    })
    .from(schema.vouchers)
    .innerJoin(schema.offers, eq(schema.offers.id, schema.vouchers.offerId))
    .where(eq(schema.vouchers.gamerId, gamerId))
    .orderBy(asc(schema.vouchers.createdAt));
  return rows;
}
