import { eq, like, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { businessDate, resolveRange } from "@/lib/analytics";
import { overview } from "@/server/analytics/overview";
import { winBack } from "@/server/analytics/people";
import { clearDemo, DEMO_EMAIL_DOMAIN, DEMO_STAFF_USERNAME, seedDemo } from "@/server/demo/demoData";
import { verifyGamerLogin } from "@/server/identity/gamers";
import { verifyStaffLogin } from "@/server/identity/staff";
import { syncStations } from "@/server/sessions/stations";
import { insertGamer, insertStaff, resetDb } from "../../support/db";

// A Saturday evening, inside opening hours (20:00 IST).
const NOW = new Date("2026-11-07T14:30:00Z");
const PASSWORD = "demo-pass-123";

beforeEach(async () => {
  await resetDb();
  await syncStations();
});

const demoGamers = () => db.select().from(schema.gamers).where(like(schema.gamers.email, `%@${DEMO_EMAIL_DOMAIN}`));

describe("seedDemo", () => {
  it("creates members, a counter account, offers and two months of visits", async () => {
    const summary = await seedDemo({ password: PASSWORD, now: NOW });

    expect(summary.gamers).toBeGreaterThanOrEqual(30);
    expect(summary.visits).toBeGreaterThan(300);
    expect(summary.offers).toBe(4);
    expect(summary.vouchers).toBeGreaterThan(0);
    expect(summary.playingNow).toBeGreaterThan(0);

    const days = await db.execute<{ n: number }>(sql`
      select count(distinct ((started_at at time zone 'Asia/Kolkata') - interval '4 hours')::date)::int as n
      from play_sessions where status = 'closed'`);
    expect(days[0].n).toBeGreaterThanOrEqual(50);
  });

  it("lets you log in as a demo member and as the demo counter staff with the demo password", async () => {
    await seedDemo({ password: PASSWORD, now: NOW });
    const [first] = await demoGamers();

    expect((await verifyGamerLogin(first.email!, PASSWORD)).ok).toBe(true);
    expect((await verifyStaffLogin(DEMO_STAFF_USERNAME, PASSWORD)).ok).toBe(true);
  });

  it("only creates visits that could really happen", async () => {
    await seedDemo({ password: PASSWORD, now: NOW });
    const sessions = await db.select().from(schema.playSessions);
    const stations = await db.select().from(schema.stations);

    for (const s of sessions) {
      const istHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hourCycle: "h23" }).format(s.startedAt));
      expect(istHour >= 11 || istHour < 3, `start at ${istHour}:00 IST`).toBe(true);
      expect(s.startedAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
      if (s.endedAt) expect(s.endedAt.getTime()).toBeLessThanOrEqual(NOW.getTime());
    }
    // No station ever holds more members than its check-in limit.
    const [{ worst }] = await db.execute<{ worst: number }>(sql`
      select coalesce(max(c), 0)::int as worst from (
        select a.id, count(*) as c from play_sessions a join play_sessions b
          on a.station_id = b.station_id and b.started_at <= a.started_at
          and coalesce(b.ended_at, 'infinity') > a.started_at
        group by a.id) x`);
    expect(worst).toBeLessThanOrEqual(Math.max(...stations.map((s) => s.maxCheckIns)));
  });

  it("keeps every member's points balance consistent and never negative", async () => {
    await seedDemo({ password: PASSWORD, now: NOW });
    const balances = await db.execute<{ balance: number }>(sql`
      select coalesce(sum(delta), 0)::int as balance from points_ledger group by gamer_id`);

    expect(balances.length).toBeGreaterThan(0);
    expect(balances.every((b) => b.balance >= 0)).toBe(true);
    // Every closed visit of 6+ minutes earned its points once.
    const [{ missing }] = await db.execute<{ missing: number }>(sql`
      select count(*)::int as missing from play_sessions s
      where s.status = 'closed' and s.ended_at - s.started_at >= interval '6 minutes'
        and not exists (select 1 from points_ledger l where l.session_id = s.id and l.reason = 'session')`);
    expect(missing).toBe(0);
  });

  it("fills the analytics dashboard, including some members to win back", async () => {
    await seedDemo({ password: PASSWORD, now: NOW });
    const range = resolveRange({ range: "30d" }, NOW);
    const { current, previous } = await overview(range);

    expect(current.visits).toBeGreaterThan(100);
    expect(current.revenuePaise).toBeGreaterThan(0);
    expect(current.unrecordedCheckouts).toBeGreaterThan(0);
    expect(previous.visits).toBeGreaterThan(0);
    expect((await winBack(NOW)).count).toBeGreaterThan(0);
    expect(range.toDate).toBe(businessDate(NOW));
  });

  it("replaces earlier demo data instead of doubling it", async () => {
    const first = await seedDemo({ password: PASSWORD, now: NOW });
    const second = await seedDemo({ password: PASSWORD, now: NOW });

    expect(second.gamers).toBe(first.gamers);
    expect((await demoGamers()).length).toBe(first.gamers);
  });
});

describe("clearDemo", () => {
  it("removes all demo data and leaves real members and staff alone", async () => {
    const realAdmin = await insertStaff({ role: "admin", username: "owner" });
    const realGamer = await insertGamer({ email: "real@example.com" });
    await seedDemo({ password: PASSWORD, now: NOW });

    await clearDemo();

    expect(await demoGamers()).toHaveLength(0);
    expect(await db.select().from(schema.staff).where(eq(schema.staff.username, DEMO_STAFF_USERNAME))).toHaveLength(0);
    expect(await db.select().from(schema.offers)).toHaveLength(0);
    expect(await db.select().from(schema.playSessions)).toHaveLength(0);
    expect(await db.select().from(schema.payments)).toHaveLength(0);
    expect(await db.select().from(schema.pointsLedger)).toHaveLength(0);
    expect((await db.select().from(schema.staff)).map((s) => s.id)).toEqual([realAdmin.id]);
    expect((await db.select().from(schema.gamers)).map((g) => g.id)).toEqual([realGamer.id]);
  });

  it("keeps real visits handled by the demo counter account, and just deactivates it", async () => {
    await seedDemo({ password: PASSWORD, now: NOW });
    const realGamer = await insertGamer({ email: "real@example.com" });
    const [demoStaff] = await db.select().from(schema.staff).where(eq(schema.staff.username, DEMO_STAFF_USERNAME));
    const [payment] = await db
      .insert(schema.payments)
      .values({ stationId: 5, amountPaise: 10000, method: "cash", recordedBy: demoStaff.id })
      .returning();
    await db.insert(schema.playSessions).values({
      gamerId: realGamer.id,
      stationId: 5,
      status: "closed",
      startedAt: new Date("2026-11-07T10:00:00Z"),
      endedAt: new Date("2026-11-07T11:00:00Z"),
      startedBy: demoStaff.id,
      endedBy: demoStaff.id,
      paymentId: payment.id,
    });

    await clearDemo();

    expect(await db.select().from(schema.playSessions)).toHaveLength(1);
    expect(await db.select().from(schema.payments)).toHaveLength(1);
    const [kept] = await db.select().from(schema.staff).where(eq(schema.staff.id, demoStaff.id));
    expect(kept.active).toBe(false);
  });
});
