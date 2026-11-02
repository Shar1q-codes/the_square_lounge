import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions, voidSession } from "@/server/sessions/checkOut";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

/** Moves a session's start back in time, as if it began `minutes` ago. */
const startedMinutesAgo = (sessionId: string, minutes: number) =>
  db
    .update(schema.playSessions)
    .set({ startedAt: new Date(Date.now() - minutes * 60_000) })
    .where(eq(schema.playSessions.id, sessionId));

async function openSession(stationId?: number) {
  const [member, gamer] = await Promise.all([insertStaff(), insertGamer()]);
  const station = stationId ? { id: stationId } : await insertStation({ console: "PS4" });
  const result = await checkIn(member.id, gamer.id, station.id);
  if (!result.ok) throw new Error(`check-in failed: ${result.reason}`);
  return { member, gamer, stationId: station.id, sessionId: result.sessionId };
}

describe("closeSessions", () => {
  it("closes one session with a payment and returns it with the minutes played", async () => {
    const { member, gamer, sessionId, stationId } = await openSession();
    await startedMinutesAgo(sessionId, 95);

    const result = await closeSessions(member.id, { sessionId }, { amountPaise: 15000, method: "upi" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sessions).toEqual([
      expect.objectContaining({ id: sessionId, gamerId: gamer.id, stationId, console: "PS4", minutes: 95 }),
    ]);
    const [payment] = await db.select().from(schema.payments);
    expect(payment).toMatchObject({ id: result.paymentId, amountPaise: 15000, method: "upi", stationId, recordedBy: member.id });
    const [session] = await db.select().from(schema.playSessions);
    expect(session).toMatchObject({ status: "closed", endedBy: member.id, paymentId: payment.id });
  });

  it("closes every open session at a station with one payment and one end time", async () => {
    const first = await openSession();
    const second = await openSession(first.stationId);
    const elsewhere = await openSession();

    const result = await closeSessions(first.member.id, { stationId: first.stationId }, { amountPaise: 30000, method: "cash" });

    expect(result.ok && result.sessions.map((s) => s.id).sort()).toEqual([first.sessionId, second.sessionId].sort());
    const closed = await db.select().from(schema.playSessions).where(eq(schema.playSessions.status, "closed"));
    expect(new Set(closed.map((s) => s.endedAt?.toISOString())).size).toBe(1);
    expect(new Set(closed.map((s) => s.paymentId)).size).toBe(1);
    const [stillOpen] = await db.select().from(schema.playSessions).where(eq(schema.playSessions.id, elsewhere.sessionId));
    expect(stillOpen.status).toBe("open");
  });

  it("allows a check-out with no amount recorded", async () => {
    const { member, sessionId } = await openSession();
    await startedMinutesAgo(sessionId, 30);

    expect((await closeSessions(member.id, { sessionId }, { amountPaise: null, method: null })).ok).toBe(true);
  });

  it("refuses when nothing is open", async () => {
    const member = await insertStaff();
    const station = await insertStation();

    expect(await closeSessions(member.id, { stationId: station.id }, { amountPaise: null, method: null })).toEqual({
      ok: false,
      reason: "nothing_open",
    });
    expect(await db.select().from(schema.payments)).toHaveLength(0);
  });

  it("can't close the same session twice", async () => {
    const { member, sessionId } = await openSession();
    await startedMinutesAgo(sessionId, 30);
    await closeSessions(member.id, { sessionId }, { amountPaise: null, method: null });

    expect((await closeSessions(member.id, { sessionId }, { amountPaise: null, method: null })).ok).toBe(false);
  });

  it("audits the check-out", async () => {
    const { member, sessionId } = await openSession();
    await startedMinutesAgo(sessionId, 30);
    await closeSessions(member.id, { sessionId }, { amountPaise: 5000, method: "card" });
    const actions = (await db.select().from(schema.auditLog)).map((a) => a.action);

    expect(actions).toContain("session.check_out");
  });
});

describe("voidSession", () => {
  it("voids within 15 minutes, keeping the record", async () => {
    const { member, sessionId } = await openSession();
    await startedMinutesAgo(sessionId, 14);

    expect(await voidSession(member.id, sessionId, "Wrong station")).toEqual({ ok: true });
    const [session] = await db.select().from(schema.playSessions);
    expect(session).toMatchObject({ status: "voided", voidReason: "Wrong station", endedBy: member.id });
    expect(session.endedAt).toBeInstanceOf(Date);
  });

  it("refuses after 15 minutes", async () => {
    const { member, sessionId } = await openSession();
    await startedMinutesAgo(sessionId, 16);

    expect(await voidSession(member.id, sessionId, "Too late")).toEqual({ ok: false, reason: "too_late" });
  });

  it("refuses a session that is no longer open", async () => {
    const { member, sessionId } = await openSession();
    await startedMinutesAgo(sessionId, 5);
    await voidSession(member.id, sessionId, "First");

    expect(await voidSession(member.id, sessionId, "Again")).toEqual({ ok: false, reason: "not_open" });
  });

  it("frees the gamer to check in again and audits it", async () => {
    const { member, gamer, sessionId, stationId } = await openSession();
    await startedMinutesAgo(sessionId, 2);
    await voidSession(member.id, sessionId, "Wrong station");

    expect((await checkIn(member.id, gamer.id, stationId)).ok).toBe(true);
    expect((await db.select().from(schema.auditLog)).map((a) => a.action)).toContain("session.void");
  });
});
