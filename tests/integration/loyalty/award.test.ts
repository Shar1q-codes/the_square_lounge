import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { balanceOf, ledgerFor } from "@/server/loyalty/ledger";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions, voidSession } from "@/server/sessions/checkOut";
import { correctSession } from "@/server/sessions/corrections";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

async function playing(minutes: number, opts: { stationId?: number; console?: "PS5" | "PS4" } = {}) {
  const staff = await insertStaff({ role: "admin" });
  const gamer = await insertGamer();
  const stationId = opts.stationId ?? (await insertStation({ console: opts.console ?? "PS5", name: "Station 02" })).id;
  const result = await checkIn(staff.id, gamer.id, stationId);
  if (!result.ok) throw new Error(result.reason);
  await db.update(schema.playSessions).set({ startedAt: minutesAgo(minutes) }).where(eq(schema.playSessions.id, result.sessionId));
  return { staff, gamer, stationId, sessionId: result.sessionId };
}

const ledgerSum = async (gamerId: string) =>
  (await db.select().from(schema.pointsLedger).where(eq(schema.pointsLedger.gamerId, gamerId))).reduce((s, r) => s + r.delta, 0);

describe("points at check-out", () => {
  it("awards points for the minutes played, linked to the session", async () => {
    const { staff, gamer, sessionId } = await playing(95);
    await closeSessions(staff.id, { sessionId }, { amountPaise: null, method: null });

    expect(await balanceOf(gamer.id)).toBe(15);
    const [row] = await db.select().from(schema.pointsLedger);
    expect(row).toMatchObject({ gamerId: gamer.id, delta: 15, reason: "session", sessionId });
  });

  it("credits every member in a whole-station check-out", async () => {
    const first = await playing(60);
    const second = await playing(30, { stationId: first.stationId });
    await closeSessions(first.staff.id, { stationId: first.stationId }, { amountPaise: 30000, method: "upi" });

    expect(await balanceOf(first.gamer.id)).toBe(10);
    expect(await balanceOf(second.gamer.id)).toBe(5);
  });

  it("writes nothing for under 6 minutes", async () => {
    const { staff, gamer, sessionId } = await playing(5);
    await closeSessions(staff.id, { sessionId }, { amountPaise: null, method: null });

    expect(await db.select().from(schema.pointsLedger).where(eq(schema.pointsLedger.gamerId, gamer.id))).toHaveLength(0);
  });

  it("caps a session at 12 hours", async () => {
    const { staff, gamer, sessionId } = await playing(15 * 60);
    await closeSessions(staff.id, { sessionId }, { amountPaise: null, method: null });

    expect(await balanceOf(gamer.id)).toBe(120);
  });

  it("gives nothing for a cancelled check-in", async () => {
    const { staff, gamer, sessionId } = await playing(3);
    await voidSession(staff.id, sessionId, "Wrong station");

    expect(await balanceOf(gamer.id)).toBe(0);
  });
});

describe("points after corrections", () => {
  it("awards a forgotten session closed by an admin", async () => {
    const { staff, gamer, sessionId } = await playing(14 * 60);
    await correctSession(staff.id, { sessionId, startedAt: minutesAgo(14 * 60), endedAt: minutesAgo(12 * 60), reason: "Forgot" });

    expect(await balanceOf(gamer.id)).toBe(20);
  });

  it("adds or removes only the difference when times change", async () => {
    const { staff, gamer, sessionId } = await playing(120);
    await closeSessions(staff.id, { sessionId }, { amountPaise: null, method: null });
    expect(await balanceOf(gamer.id)).toBe(20);

    await correctSession(staff.id, { sessionId, startedAt: minutesAgo(120), endedAt: minutesAgo(60), reason: "Left earlier" });
    expect(await balanceOf(gamer.id)).toBe(10);

    await correctSession(staff.id, { sessionId, startedAt: minutesAgo(180), endedAt: minutesAgo(60), reason: "Came earlier" });
    expect(await balanceOf(gamer.id)).toBe(20);

    const reasons = (await db.select().from(schema.pointsLedger)).map((r) => [r.reason, r.delta]);
    expect(reasons).toEqual([
      ["session", 20],
      ["correction", -10],
      ["correction", 10],
    ]);
  });

  it("writes no entry when a correction doesn't change the points", async () => {
    const { staff, sessionId } = await playing(60);
    await closeSessions(staff.id, { sessionId }, { amountPaise: null, method: null });
    const [session] = await db.select().from(schema.playSessions);
    await correctSession(staff.id, {
      sessionId,
      startedAt: new Date(session.startedAt.getTime() - 60_000),
      endedAt: session.endedAt!,
      reason: "One minute earlier",
    });

    expect(await db.select().from(schema.pointsLedger)).toHaveLength(1);
  });
});

describe("ledgerFor", () => {
  it("describes each entry and keeps the balance equal to the ledger sum", async () => {
    const { staff, gamer, sessionId } = await playing(95);
    await closeSessions(staff.id, { sessionId }, { amountPaise: null, method: null });
    const [entry] = await ledgerFor(gamer.id);

    expect(entry).toMatchObject({ delta: 15, description: "Played 1 h 35 min at Station 02" });
    expect(await balanceOf(gamer.id)).toBe(await ledgerSum(gamer.id));
  });
});
