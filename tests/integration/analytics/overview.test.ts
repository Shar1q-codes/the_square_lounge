import { beforeEach, describe, expect, it } from "vitest";
import { overview, paymentsByMethod, dailyTrend } from "@/server/analytics/overview";
import { resetDb } from "../../support/db";
import { RANGE, seedAnalytics } from "../../support/analyticsFixture";

beforeEach(async () => {
  await resetDb();
  await seedAnalytics();
});

describe("overview", () => {
  it("matches the hand-computed numbers for 1–7 Oct", async () => {
    const { current } = await overview(RANGE);

    expect(current).toEqual({
      visits: 4, // s1–s4; voided and open sessions are left out
      members: 3, // A, B, C
      minutes: 420, // 120 + 120 + 120 + 60
      revenuePaise: 70000, // ₹300 + ₹400; s4 not recorded
      repeatMembers: 1, // only A has 2+ visits
      newMembers: 2, // B and C joined in the range
      checkouts: 3,
      unrecordedCheckouts: 1,
    });
  });

  it("compares with the previous 7 days", async () => {
    const { previous } = await overview(RANGE);

    expect(previous).toEqual({
      visits: 2,
      members: 2,
      minutes: 120,
      revenuePaise: 25000,
      repeatMembers: 0,
      newMembers: 0,
      checkouts: 2,
      unrecordedCheckouts: 0,
    });
  });
});

describe("dailyTrend", () => {
  it("lists every business day, putting after-midnight visits on the night before", async () => {
    const days = await dailyTrend(RANGE);

    expect(days).toEqual([
      { date: "2026-10-01", visits: 1, revenuePaise: 30000 },
      { date: "2026-10-02", visits: 0, revenuePaise: 0 },
      { date: "2026-10-03", visits: 2, revenuePaise: 40000 },
      { date: "2026-10-04", visits: 1, revenuePaise: 0 }, // s4 started 5 Oct 02:00 IST
      { date: "2026-10-05", visits: 0, revenuePaise: 0 },
      { date: "2026-10-06", visits: 0, revenuePaise: 0 },
      { date: "2026-10-07", visits: 0, revenuePaise: 0 },
    ]);
  });
});

describe("paymentsByMethod", () => {
  it("groups check-outs by method, with missing amounts as not recorded", async () => {
    const rows = await paymentsByMethod(RANGE);

    expect(rows).toEqual([
      { method: "cash", checkouts: 1, visits: 2, revenuePaise: 40000 },
      { method: "upi", checkouts: 1, visits: 1, revenuePaise: 30000 },
      { method: "not_recorded", checkouts: 1, visits: 1, revenuePaise: 0 },
    ]);
  });
});
