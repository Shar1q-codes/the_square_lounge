import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { createOffer, listOffersForAdmin, listShopOffers, updateOffer, type OfferInput } from "@/server/loyalty/offers";
import { insertGamer, insertStaff, resetDb } from "../../support/db";

beforeEach(resetDb);

const hours = (h: number) => new Date(Date.now() + h * 3_600_000);

const offer = (overrides: Partial<OfferInput> = {}): OfferInput => ({
  title: "Free PS4 hour",
  description: "One hour on any PS4 station.",
  pointsCost: 100,
  category: "gaming",
  stock: null,
  maxPerGamer: null,
  startsAt: null,
  endsAt: null,
  active: true,
  ...overrides,
});

async function claimed(offerId: string, status: "active" | "used" | "expired" | "cancelled") {
  const gamer = await insertGamer();
  await db.insert(schema.vouchers).values({
    code: `V-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    gamerId: gamer.id,
    offerId,
    pointsSpent: 100,
    status,
    expiresAt: hours(24 * 30),
  });
}

describe("offers", () => {
  it("creates an offer and audits it", async () => {
    const admin = await insertStaff({ role: "admin" });
    const id = await createOffer(admin.id, offer());

    expect((await listOffersForAdmin()).map((o) => [o.id, o.title, o.claimed])).toEqual([[id, "Free PS4 hour", 0]]);
    expect((await db.select().from(schema.auditLog)).map((a) => a.action)).toEqual(["offer.create"]);
  });

  it("updates an offer and audits it", async () => {
    const admin = await insertStaff({ role: "admin" });
    const id = await createOffer(admin.id, offer());

    expect(await updateOffer(admin.id, id, offer({ pointsCost: 120, active: false }))).toEqual({ ok: true });
    expect((await listOffersForAdmin())[0]).toMatchObject({ pointsCost: 120, active: false });
    expect((await db.select().from(schema.auditLog)).map((a) => a.action)).toEqual(["offer.create", "offer.update"]);
  });

  it("refuses to update an offer that doesn't exist", async () => {
    const admin = await insertStaff({ role: "admin" });

    expect(await updateOffer(admin.id, "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f", offer())).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("listShopOffers", () => {
  it("shows only active, in-date, in-stock offers, cheapest first", async () => {
    const admin = await insertStaff({ role: "admin" });
    const visible = await createOffer(admin.id, offer({ title: "Snack combo", pointsCost: 60 }));
    const unlimited = await createOffer(admin.id, offer({ title: "Free PS5 hour", pointsCost: 150 }));
    await createOffer(admin.id, offer({ title: "Inactive", active: false }));
    await createOffer(admin.id, offer({ title: "Not yet", startsAt: hours(2) }));
    await createOffer(admin.id, offer({ title: "Ended", startsAt: hours(-48), endsAt: hours(-1) }));
    const soldOut = await createOffer(admin.id, offer({ title: "Sold out", stock: 1 }));
    await claimed(soldOut, "active");

    const shop = await listShopOffers();

    expect(shop.map((o) => o.id)).toEqual([visible, unlimited]);
  });

  it("gives stock back for cancelled and expired vouchers", async () => {
    const admin = await insertStaff({ role: "admin" });
    const id = await createOffer(admin.id, offer({ stock: 2 }));
    await claimed(id, "used");
    await claimed(id, "cancelled");
    await claimed(id, "expired");

    expect(await listShopOffers()).toEqual([expect.objectContaining({ id, remaining: 1 })]);
  });
});
