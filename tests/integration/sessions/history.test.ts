import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { exportGamerData } from "@/server/identity/consent";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions, voidSession } from "@/server/sessions/checkOut";
import { currentSession, recentVisits } from "@/server/sessions/history";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

async function playedFor(staffId: string, gamerId: string, stationId: number, minutes: number) {
  const result = await checkIn(staffId, gamerId, stationId);
  if (!result.ok) throw new Error(result.reason);
  await db
    .update(schema.playSessions)
    .set({ startedAt: new Date(Date.now() - minutes * 60_000) })
    .where(eq(schema.playSessions.id, result.sessionId));
  return result.sessionId;
}

describe("currentSession", () => {
  it("shows where the gamer is playing now", async () => {
    const [member, gamer] = await Promise.all([insertStaff(), insertGamer()]);
    const station = await insertStation({ name: "Station 04" });
    await checkIn(member.id, gamer.id, station.id);

    expect(await currentSession(gamer.id)).toMatchObject({ stationName: "Station 04", startedAt: expect.any(Date) });
  });

  it("is null when not playing", async () => {
    const gamer = await insertGamer();

    expect(await currentSession(gamer.id)).toBeNull();
  });
});

describe("recentVisits", () => {
  it("lists only this gamer's closed sessions, newest first, with minutes and no amounts", async () => {
    const [member, gamer, other, station] = await Promise.all([insertStaff(), insertGamer(), insertGamer(), insertStation()]);
    const older = await playedFor(member.id, gamer.id, station.id, 180);
    await closeSessions(member.id, { sessionId: older }, { amountPaise: 20000, method: "cash" });
    const newer = await playedFor(member.id, gamer.id, station.id, 45);
    await closeSessions(member.id, { sessionId: newer }, { amountPaise: 10000, method: "upi" });
    const voided = await playedFor(member.id, gamer.id, station.id, 5);
    await voidSession(member.id, voided, "Wrong station");
    const othersVisit = await playedFor(member.id, other.id, station.id, 60);
    await closeSessions(member.id, { sessionId: othersVisit }, { amountPaise: null, method: null });

    const visits = await recentVisits(gamer.id);

    expect(visits.map((v) => v.id)).toEqual([newer, older]);
    expect(visits[0]).toMatchObject({ minutes: 45, stationName: "Test Station" });
    expect(JSON.stringify(visits)).not.toMatch(/amount|paise|20000/i);
  });
});

describe("exportGamerData", () => {
  it("includes the gamer's sessions", async () => {
    const [member, gamer, station] = await Promise.all([insertStaff(), insertGamer(), insertStation({ name: "Station 02" })]);
    const id = await playedFor(member.id, gamer.id, station.id, 30);
    await closeSessions(member.id, { sessionId: id }, { amountPaise: null, method: null });

    const data = await exportGamerData(gamer.id);

    expect(data.sessions).toEqual([expect.objectContaining({ station: "Station 02", status: "closed", minutes: 30 })]);
  });
});
