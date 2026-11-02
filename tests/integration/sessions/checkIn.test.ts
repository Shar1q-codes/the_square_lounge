import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { checkIn } from "@/server/sessions/checkIn";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

describe("checkIn", () => {
  it("opens a session stamped with the database clock and the staff member", async () => {
    const [member, gamer, station] = await Promise.all([insertStaff(), insertGamer(), insertStation()]);
    const result = await checkIn(member.id, gamer.id, station.id);

    expect(result.ok).toBe(true);
    const [session] = await db.select().from(schema.playSessions);
    expect(session).toMatchObject({ gamerId: gamer.id, stationId: station.id, status: "open", startedBy: member.id, endedAt: null });
    expect(Math.abs(session.startedAt.getTime() - Date.now())).toBeLessThan(60_000);
  });

  it("refuses a gamer who is already playing, saying where", async () => {
    const [member, gamer] = await Promise.all([insertStaff(), insertGamer()]);
    const first = await insertStation({ name: "Station 02" });
    const second = await insertStation({ name: "Station 03" });
    await checkIn(member.id, gamer.id, first.id);

    expect(await checkIn(member.id, gamer.id, second.id)).toMatchObject({
      ok: false,
      reason: "already_playing",
      stationName: "Station 02",
    });
  });

  it("lets an 8-seat station take 8 members and refuses the 9th", async () => {
    const member = await insertStaff();
    const station = await insertStation({ maxCheckIns: 8 });
    const gamers = await Promise.all(Array.from({ length: 9 }, () => insertGamer()));

    for (const gamer of gamers.slice(0, 8)) expect((await checkIn(member.id, gamer.id, station.id)).ok).toBe(true);
    expect(await checkIn(member.id, gamers[8].id, station.id)).toMatchObject({ ok: false, reason: "station_full" });
  });

  it("gives the last seat to exactly one of two simultaneous check-ins", async () => {
    const member = await insertStaff();
    const station = await insertStation({ maxCheckIns: 1 });
    const [a, b] = await Promise.all([insertGamer(), insertGamer()]);

    const results = await Promise.all([checkIn(member.id, a.id, station.id), checkIn(member.id, b.id, station.id)]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok)).toEqual([{ ok: false, reason: "station_full" }]);
  });

  it("refuses an inactive or unknown station", async () => {
    const [member, gamer] = await Promise.all([insertStaff(), insertGamer()]);
    const closed = await insertStation({ active: false });

    expect(await checkIn(member.id, gamer.id, closed.id)).toEqual({ ok: false, reason: "station_inactive" });
    expect(await checkIn(member.id, gamer.id, 424242)).toEqual({ ok: false, reason: "station_inactive" });
  });

  it("refuses a deleted account", async () => {
    const [member, station] = await Promise.all([insertStaff(), insertStation()]);
    const gamer = await insertGamer({ deletedAt: new Date(), email: null });

    expect(await checkIn(member.id, gamer.id, station.id)).toEqual({ ok: false, reason: "gamer_not_found" });
  });

  it("frees the seat for a new check-in once the session is closed", async () => {
    const [member, gamer, station] = await Promise.all([insertStaff(), insertGamer(), insertStation({ maxCheckIns: 1 })]);
    await checkIn(member.id, gamer.id, station.id);
    await db
      .update(schema.playSessions)
      .set({ status: "closed", endedAt: new Date(Date.now() + 60_000) })
      .where(eq(schema.playSessions.gamerId, gamer.id));

    expect((await checkIn(member.id, gamer.id, station.id)).ok).toBe(true);
  });

  it("writes an audit entry", async () => {
    const [member, gamer, station] = await Promise.all([insertStaff(), insertGamer(), insertStation()]);
    await checkIn(member.id, gamer.id, station.id);
    const [entry] = await db.select().from(schema.auditLog);

    expect(entry).toMatchObject({ action: "session.check_in", actorStaffId: member.id, targetType: "play_session" });
  });
});
