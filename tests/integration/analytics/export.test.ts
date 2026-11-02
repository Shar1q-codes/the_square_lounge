import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { exportReport, REPORTS } from "@/server/analytics/csv";
import { resetDb } from "../../support/db";
import { ist, RANGE, seedAnalytics } from "../../support/analyticsFixture";

let seeded: Awaited<ReturnType<typeof seedAnalytics>>;
const NOW = ist("2026-11-03 15:00");

beforeEach(async () => {
  await resetDb();
  seeded = await seedAnalytics();
});

const lines = (csv: string) => csv.replace(/^﻿/, "").trim().split("\n");

describe("exportReport", () => {
  it("exports one row per visit with its share of the payment, hiding deleted members' codes", async () => {
    const result = await exportReport(seeded.staff.id, "visits", RANGE, NOW);

    expect(result?.filename).toBe("square-lounge-visits-2026-10-01-to-2026-10-07.csv");
    expect(lines(result!.csv)).toEqual([
      "Business day,Start (IST),End (IST),Minutes,Station,Console,Member code,Area,Pincode,Age band,Revenue share (Rs),Payment method",
      "2026-10-01,2026-10-01 18:00,2026-10-01 20:00,120,Station 01,PS5,SQ-AAAAA,Malakpet,500036,25–34,300.00,upi",
      "2026-10-03,2026-10-03 23:30,2026-10-04 01:30,120,Station 01,PS5,SQ-AAAAA,Malakpet,500036,25–34,200.00,cash",
      "2026-10-03,2026-10-03 23:30,2026-10-04 01:30,120,Station 01,PS5,SQ-BBBBB,Dilsukhnagar,500060,13–17,200.00,cash",
      "2026-10-04,2026-10-05 02:00,2026-10-05 03:00,60,Station 02,PS4,deleted,Malakpet,500036,unknown,,not recorded",
    ]);
  });

  it("only includes members who opted in to offers in the win-back download", async () => {
    await db.update(schema.gamers).set({ marketingOptIn: false }).where(eq(schema.gamers.id, seeded.a.id));
    const none = await exportReport(seeded.staff.id, "win-back", RANGE, NOW);
    expect(lines(none!.csv)).toHaveLength(1); // header only

    await db.update(schema.gamers).set({ marketingOptIn: true }).where(eq(schema.gamers.id, seeded.a.id));
    const some = await exportReport(seeded.staff.id, "win-back", RANGE, NOW);
    expect(lines(some!.csv)[1]).toContain("Arjun A");
  });

  it("produces every report without errors", async () => {
    for (const report of REPORTS) {
      const result = await exportReport(seeded.staff.id, report, RANGE, NOW);
      expect(lines(result!.csv).length).toBeGreaterThan(0);
    }
  });

  it("returns null for an unknown report", async () => {
    expect(await exportReport(seeded.staff.id, "secrets", RANGE, NOW)).toBeNull();
  });

  it("audits each download with the report and dates", async () => {
    await exportReport(seeded.staff.id, "areas", RANGE, NOW);
    const [entry] = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "analytics.export"));

    expect(entry).toMatchObject({ actorStaffId: seeded.staff.id, details: { report: "areas", from: "2026-10-01", to: "2026-10-07" } });
  });
});
