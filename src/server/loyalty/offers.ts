import "server-only";
import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { writeAudit } from "@/server/identity/audit";

export type OfferInput = {
  title: string;
  description: string;
  pointsCost: number;
  category: "gaming" | "cafe" | "other";
  stock: number | null;
  maxPerGamer: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
};

/**
 * Vouchers that hold stock: everything except cancelled and expired ones. Written with explicit
 * table names: Drizzle leaves columns unqualified here, so "id" would match the voucher's own id.
 */
export const claimedCount = sql<number>`(
  select count(*)::int from "vouchers" v
  where v."offer_id" = "offers"."id" and v."status" not in ('cancelled', 'expired')
)`;

const auditable = (input: OfferInput) => ({
  ...input,
  startsAt: input.startsAt?.toISOString() ?? null,
  endsAt: input.endsAt?.toISOString() ?? null,
});

export async function createOffer(adminId: string, input: OfferInput): Promise<string> {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.offers)
      .values({ ...input, createdBy: adminId })
      .returning({ id: schema.offers.id });
    await writeAudit({ actorStaffId: adminId, action: "offer.create", targetType: "offer", targetId: created.id, details: auditable(input) }, tx);
    return created.id;
  });
}

export async function updateOffer(adminId: string, offerId: string, input: OfferInput): Promise<{ ok: true } | { ok: false; reason: "not_found" }> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.offers)
      .set({ ...input, updatedAt: sql`now()` })
      .where(eq(schema.offers.id, offerId))
      .returning({ id: schema.offers.id });
    if (updated.length === 0) return { ok: false, reason: "not_found" } as const;
    await writeAudit({ actorStaffId: adminId, action: "offer.update", targetType: "offer", targetId: offerId, details: auditable(input) }, tx);
    return { ok: true } as const;
  });
}

export async function listOffersForAdmin() {
  return db
    .select({
      id: schema.offers.id,
      title: schema.offers.title,
      description: schema.offers.description,
      pointsCost: schema.offers.pointsCost,
      category: schema.offers.category,
      stock: schema.offers.stock,
      maxPerGamer: schema.offers.maxPerGamer,
      startsAt: schema.offers.startsAt,
      endsAt: schema.offers.endsAt,
      active: schema.offers.active,
      claimed: claimedCount,
    })
    .from(schema.offers)
    .orderBy(desc(schema.offers.active), asc(schema.offers.pointsCost));
}

export type ShopOffer = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: "gaming" | "cafe" | "other";
  endsAt: Date | null;
  /** null = unlimited */
  remaining: number | null;
};

/** What members can claim right now: active, started, not ended, not sold out. Cheapest first. */
export async function listShopOffers(): Promise<ShopOffer[]> {
  const rows = await db
    .select({
      id: schema.offers.id,
      title: schema.offers.title,
      description: schema.offers.description,
      pointsCost: schema.offers.pointsCost,
      category: schema.offers.category,
      endsAt: schema.offers.endsAt,
      stock: schema.offers.stock,
      claimed: claimedCount,
    })
    .from(schema.offers)
    .where(
      and(
        eq(schema.offers.active, true),
        or(isNull(schema.offers.startsAt), lte(schema.offers.startsAt, sql`now()`)),
        or(isNull(schema.offers.endsAt), gt(schema.offers.endsAt, sql`now()`)),
      ),
    )
    .orderBy(asc(schema.offers.pointsCost), asc(schema.offers.title));

  return rows
    .map(({ stock, claimed, ...o }) => ({ ...o, remaining: stock === null ? null : Math.max(stock - claimed, 0) }))
    .filter((o) => o.remaining === null || o.remaining > 0);
}

