import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { checkIn } from "@/server/sessions/checkIn";
import { voidSession } from "@/server/sessions/checkOut";
import { correctSession, listSessionsForAdmin } from "@/server/sessions/corrections";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

async function openSession(startedHoursAgo: number) {
  const [admin, gamer, station] = await Promise.all([insertStaff({ role: "admin" }), insertGamer({ fullName: "Late Leaver" }), insertStation()]);
  const result = await checkIn(admin.id, gamer.id, station.id);
  if (!result.ok) throw new Error("check-in failed");
  await db.update(schema.playSessions).set({ startedAt: hoursAgo(startedHoursAgo) }).where(eq(schema.playSessions.id, result.sessionId));
  return { admin, sessionId: result.sessionId };
}

describe("correctSession", () => {
  it("closes a forgotten session with the corrected times and audits before/after", async () => {
    const { admin, sessionId } = await openSession(14);
    const startedAt = hoursAgo(14);
    const endedAt = hoursAgo(12);

    expect(await correctSession(admin.id, { sessionId, startedAt, endedAt, reason: "Forgot to check out" })).toEqual({ ok: true });

    const [session] = await db.select().from(schema.playSessions);
    expect(session).toMatchObject({ status: "closed", endedBy: admin.id });
    expect(session.endedAt?.toISOString()).toBe(endedAt.toISOString());
    const [entry] = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "session.correct"));
    expect(entry.details).toMatchObject({
      reason: "Forgot to check out",
      before: { status: "open", endedAt: null },
      after: { status: "closed", endedAt: endedAt.toISOString() },
    });
  });

  it("refuses an end time in the future", async () => {
    const { admin, sessionId } = await openSession(2);

    expect(
      await correctSession(admin.id, { sessionId, startedAt: hoursAgo(2), endedAt: new Date(Date.now() + 3_600_000), reason: "Typo fix" }),
    ).toEqual({ ok: false, reason: "future" });
  });

  it("refuses to change a voided session", async () => {
    const { admin, sessionId } = await openSession(0);
    await voidSession(admin.id, sessionId, "Wrong station");

    expect(await correctSession(admin.id, { sessionId, startedAt: hoursAgo(1), endedAt: hoursAgo(0.5), reason: "Nope" })).toEqual({
      ok: false,
      reason: "voided",
    });
  });

  it("refuses a session that doesn't exist", async () => {
    const admin = await insertStaff({ role: "admin" });

    expect(
      await correctSession(admin.id, {
        sessionId: "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f",
        startedAt: hoursAgo(2),
        endedAt: hoursAgo(1),
        reason: "Missing",
      }),
    ).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("listSessionsForAdmin", () => {
  it("filters open, needs-attention and recent sessions", async () => {
    const { sessionId: longOne } = await openSession(13);
    const { sessionId: shortOne } = await openSession(1);

    const open = await listSessionsForAdmin("open");
    const attention = await listSessionsForAdmin("attention");
    const recent = await listSessionsForAdmin("recent");

    expect(open.map((s) => s.id).sort()).toEqual([longOne, shortOne].sort());
    expect(attention.map((s) => s.id)).toEqual([longOne]);
    expect(recent).toHaveLength(2);
    expect(attention[0]).toMatchObject({ fullName: "Late Leaver", status: "open", stationName: "Test Station" });
  });
});
