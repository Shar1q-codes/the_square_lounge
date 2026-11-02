import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { loyaltySummary } from "@/server/analytics/loyalty";
import { audience, byArea, byPincode, topMembers, winBack, winBackContacts } from "@/server/analytics/people";
import { resetDb } from "../../support/db";
import { ist, RANGE, seedAnalytics } from "../../support/analyticsFixture";

let seeded: Awaited<ReturnType<typeof seedAnalytics>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedAnalytics();
});

const NOW = ist("2026-11-03 15:00");

describe("where members come from", () => {
  it("groups visits, members and revenue by area", async () => {
    expect(await byArea(RANGE)).toEqual([
      { label: "Malakpet", visits: 3, members: 2, revenuePaise: 50000 },
      { label: "Dilsukhnagar", visits: 1, members: 1, revenuePaise: 20000 },
    ]);
  });

  it("treats differently typed area names as one", async () => {
    await db.update(schema.gamers).set({ area: "  malakpet " }).where(eq(schema.gamers.memberCode, "SQ-CCCCC"));
    expect((await byArea(RANGE))[0].label).toBe("Malakpet");
  });

  it("groups by pincode", async () => {
    expect((await byPincode(RANGE)).map((r) => [r.label, r.visits])).toEqual([
      ["500036", 3],
      ["500060", 1],
    ]);
  });

  it("puts everything beyond the top 10 into Other", async () => {
    const { staff } = seeded;
    for (let i = 0; i < 11; i++) {
      const [g] = await db
        .insert(schema.gamers)
        .values({ memberCode: `SQ-X${String(i).padStart(4, "2")}`, area: `Area ${i}`, pincode: "500001", referralSource: "other" })
        .returning();
      await db.insert(schema.playSessions).values({
        gamerId: g.id,
        stationId: 1,
        status: "closed",
        startedAt: ist("2026-10-06 12:00"),
        endedAt: ist("2026-10-06 13:00"),
        startedBy: staff.id,
      });
    }
    const rows = await byArea(RANGE);

    expect(rows).toHaveLength(11);
    expect(rows[10]).toMatchObject({ label: "Other", visits: 3 });
  });
});

describe("audience", () => {
  it("splits visits and members by age band, gender and sign-up source", async () => {
    const result = await audience(RANGE);

    expect(result.ageBands).toEqual([
      { key: "13–17", visits: 1, members: 1 },
      { key: "18–24", visits: 0, members: 0 },
      { key: "25–34", visits: 2, members: 1 },
      { key: "35+", visits: 0, members: 0 },
      { key: "unknown", visits: 1, members: 1 },
    ]);
    expect(result.genders.filter((g) => g.members > 0)).toEqual([
      { key: "male", visits: 2, members: 1 },
      { key: "female", visits: 1, members: 1 },
      { key: "unknown", visits: 1, members: 1 },
    ]);
    // "returning" = members from that source with 2+ visits ever (A also played in September)
    expect(result.sources.filter((s) => s.members > 0)).toEqual([
      { key: "instagram", visits: 2, members: 1, returning: 1 },
      { key: "google", visits: 1, members: 1, returning: 0 },
      { key: "friend", visits: 1, members: 1, returning: 0 },
    ]);
  });
});

describe("members", () => {
  it("lists top members by hours, never deleted accounts", async () => {
    expect(await topMembers(RANGE)).toEqual([
      { memberCode: "SQ-AAAAA", fullName: "Arjun A", visits: 2, minutes: 240, balance: 0 },
      { memberCode: "SQ-BBBBB", fullName: "Bina B", visits: 1, minutes: 120, balance: 0 },
    ]);
  });

  it("finds regulars (2+ visits) with no visit in the last 15 days", async () => {
    const result = await winBack(NOW);

    expect(result.count).toBe(1);
    expect(result.rows).toEqual([
      expect.objectContaining({ memberCode: "SQ-AAAAA", fullName: "Arjun A", visits: 3, optedIn: true }),
    ]);
  });

  it("does not count someone who visited within 15 days", async () => {
    expect((await winBack(ist("2026-10-15 12:00"))).count).toBe(0);
  });

  it("only exports contact details of members who opted in to marketing", async () => {
    await db.update(schema.gamers).set({ marketingOptIn: false }).where(eq(schema.gamers.id, seeded.a.id));
    expect(await winBackContacts(NOW)).toEqual([]);

    await db.update(schema.gamers).set({ marketingOptIn: true }).where(eq(schema.gamers.id, seeded.a.id));
    expect(await winBackContacts(NOW)).toEqual([
      expect.objectContaining({ fullName: "Arjun A", email: seeded.a.email, phone: seeded.a.phone, area: "Malakpet", visits: 3 }),
    ]);
  });
});

describe("loyaltySummary", () => {
  it("totals points earned and spent, outstanding points and voucher outcomes", async () => {
    const { a, b, staff } = seeded;
    const [offer] = await db
      .insert(schema.offers)
      .values({ title: "Soft drink", pointsCost: 30, category: "cafe", createdBy: staff.id })
      .returning();
    const voucher = (gamerId: string, status: "active" | "used" | "expired" | "cancelled", code: string) => ({
      code,
      gamerId,
      offerId: offer.id,
      pointsSpent: 30,
      status,
      expiresAt: ist("2026-11-02 12:00"),
      createdAt: ist("2026-10-02 12:00"),
    });
    await db.insert(schema.vouchers).values([voucher(a.id, "used", "V-AAAAA2"), voucher(b.id, "expired", "V-BBBBB2")]);
    await db.insert(schema.pointsLedger).values([
      { gamerId: a.id, delta: 40, reason: "session", createdAt: ist("2026-10-01 20:00") },
      { gamerId: b.id, delta: 20, reason: "session", createdAt: ist("2026-10-04 01:30") },
      { gamerId: a.id, delta: -30, reason: "redemption", createdAt: ist("2026-10-02 12:00") },
      { gamerId: b.id, delta: -30, reason: "redemption", createdAt: ist("2026-10-02 12:00") },
      { gamerId: b.id, delta: 30, reason: "refund", createdAt: ist("2026-10-06 12:00") },
      { gamerId: a.id, delta: 500, reason: "adjustment", createdAt: ist("2026-08-01 12:00") }, // before the range
    ]);

    expect(await loyaltySummary(RANGE)).toEqual({
      earned: 60,
      spent: 60,
      refunded: 30,
      outstanding: 530, // 40 - 30 + 500 (A) + 20 - 30 + 30 (B)
      claimed: 2,
      used: 1,
      expired: 1,
      cancelled: 0,
      topOffers: [{ title: "Soft drink", claimed: 2, used: 1 }],
    });
  });
});
