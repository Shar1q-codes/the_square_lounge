import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { addLedgerEntry, balanceOf } from "@/server/loyalty/ledger";
import { createOffer, type OfferInput } from "@/server/loyalty/offers";
import { cancelVoucher, claimOffer, expireOverdueVouchers, vouchersFor } from "@/server/loyalty/vouchers";
import { insertGamer, insertStaff, resetDb } from "../../support/db";

beforeEach(resetDb);

const hours = (h: number) => new Date(Date.now() + h * 3_600_000);

async function setup(offerOverrides: Partial<OfferInput> = {}, points = 100) {
  const admin = await insertStaff({ role: "admin" });
  const gamer = await insertGamer();
  if (points) await addLedgerEntry(db, { gamerId: gamer.id, delta: points, reason: "adjustment", note: "test" });
  const offerId = await createOffer(admin.id, {
    title: "Free PS4 hour",
    description: "",
    pointsCost: 100,
    category: "gaming",
    stock: null,
    maxPerGamer: null,
    startsAt: null,
    endsAt: null,
    active: true,
    ...offerOverrides,
  });
  return { admin, gamer, offerId };
}

const ledgerSum = async (gamerId: string) =>
  (await db.select().from(schema.pointsLedger).where(eq(schema.pointsLedger.gamerId, gamerId))).reduce((s, r) => s + r.delta, 0);

describe("claimOffer", () => {
  it("spends the points and issues a 30-day voucher", async () => {
    const { gamer, offerId } = await setup();
    const result = await claimOffer(gamer.id, offerId);

    expect(result).toMatchObject({ ok: true, code: expect.stringMatching(/^V-[A-Z0-9]{6}$/) });
    expect(await balanceOf(gamer.id)).toBe(0);
    const [voucher] = await db.select().from(schema.vouchers);
    expect(voucher).toMatchObject({ gamerId: gamer.id, offerId, pointsSpent: 100, status: "active" });
    const days = (voucher.expiresAt.getTime() - voucher.createdAt.getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(30);
    expect(await balanceOf(gamer.id)).toBe(await ledgerSum(gamer.id));
  });

  it("refuses when the member is short, saying by how much", async () => {
    const { gamer, offerId } = await setup({}, 99);

    expect(await claimOffer(gamer.id, offerId)).toEqual({ ok: false, reason: "not_enough_points", shortBy: 1 });
    expect(await db.select().from(schema.vouchers)).toHaveLength(0);
  });

  it("refuses hidden, not-yet-started and ended offers", async () => {
    for (const overrides of [{ active: false }, { startsAt: hours(1) }, { startsAt: hours(-5), endsAt: hours(-1) }]) {
      await resetDb();
      const { gamer, offerId } = await setup(overrides);
      expect(await claimOffer(gamer.id, offerId)).toEqual({ ok: false, reason: "unavailable" });
    }
  });

  it("enforces the per-member limit", async () => {
    const { gamer, offerId } = await setup({ maxPerGamer: 1 }, 300);
    await claimOffer(gamer.id, offerId);

    expect(await claimOffer(gamer.id, offerId)).toEqual({ ok: false, reason: "limit_reached" });
  });

  it("sells the last item to exactly one of two members claiming at once", async () => {
    const { admin, offerId } = await setup({ stock: 1 }, 0);
    const [a, b] = await Promise.all([insertGamer(), insertGamer()]);
    for (const g of [a, b]) await addLedgerEntry(db, { gamerId: g.id, delta: 100, reason: "adjustment", actorStaffId: admin.id });

    const results = await Promise.all([claimOffer(a.id, offerId), claimOffer(b.id, offerId)]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toEqual({ ok: false, reason: "sold_out" });
  });

  it("can't overspend with two quick taps", async () => {
    const { gamer, offerId } = await setup({}, 150);

    const results = await Promise.all([claimOffer(gamer.id, offerId), claimOffer(gamer.id, offerId)]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await balanceOf(gamer.id)).toBe(50);
  });
});

describe("cancelVoucher", () => {
  it("refunds an active voucher and frees its stock", async () => {
    const { gamer, offerId } = await setup({ stock: 1 });
    const claim = await claimOffer(gamer.id, offerId);
    if (!claim.ok) throw new Error("claim failed");

    expect(await cancelVoucher(gamer.id, claim.voucherId)).toEqual({ ok: true });
    expect(await balanceOf(gamer.id)).toBe(100);
    expect((await claimOffer(gamer.id, offerId)).ok).toBe(true);
  });

  it("only works once, and only for the owner", async () => {
    const { gamer, offerId } = await setup();
    const stranger = await insertGamer();
    const claim = await claimOffer(gamer.id, offerId);
    if (!claim.ok) throw new Error("claim failed");

    expect(await cancelVoucher(stranger.id, claim.voucherId)).toEqual({ ok: false, reason: "not_active" });
    await cancelVoucher(gamer.id, claim.voucherId);
    expect(await cancelVoucher(gamer.id, claim.voucherId)).toEqual({ ok: false, reason: "not_active" });
    expect(await balanceOf(gamer.id)).toBe(100);
  });
});

describe("expiry", () => {
  it("expires overdue vouchers once, refunding the points", async () => {
    const { gamer, offerId } = await setup();
    const claim = await claimOffer(gamer.id, offerId);
    if (!claim.ok) throw new Error("claim failed");
    await db.update(schema.vouchers).set({ expiresAt: hours(-1) }).where(eq(schema.vouchers.id, claim.voucherId));

    expect(await expireOverdueVouchers()).toBe(1);
    expect(await expireOverdueVouchers()).toBe(0);
    expect(await balanceOf(gamer.id)).toBe(100);
    expect((await db.select().from(schema.vouchers))[0].status).toBe("expired");
  });

  it("happens before a member's vouchers are listed", async () => {
    const { gamer, offerId } = await setup();
    const claim = await claimOffer(gamer.id, offerId);
    if (!claim.ok) throw new Error("claim failed");
    await db.update(schema.vouchers).set({ expiresAt: hours(-1) }).where(eq(schema.vouchers.id, claim.voucherId));

    expect((await vouchersFor(gamer.id)).map((v) => [v.offerTitle, v.status])).toEqual([["Free PS4 hour", "expired"]]);
  });
});
