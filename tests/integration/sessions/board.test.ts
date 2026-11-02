import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { getBoard } from "@/server/sessions/board";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions } from "@/server/sessions/checkOut";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

describe("getBoard", () => {
  it("lists active stations in id order with their open sessions only", async () => {
    const member = await insertStaff();
    const s1 = await insertStation({ id: 1, name: "Station 01", maxCheckIns: 8 });
    await insertStation({ id: 2, name: "Station 02" });
    await insertStation({ id: 3, name: "Retired", active: false });
    const playing = await insertGamer({ fullName: "Playing Now", memberCode: "SQ-AAAAA" });
    const finished = await insertGamer();
    await checkIn(member.id, playing.id, s1.id);
    const done = await checkIn(member.id, finished.id, s1.id);
    if (done.ok) {
      await db.update(schema.playSessions).set({ startedAt: new Date(Date.now() - 600_000) }).where(eq(schema.playSessions.id, done.sessionId));
      await closeSessions(member.id, { sessionId: done.sessionId }, { amountPaise: null, method: null });
    }

    const board = await getBoard();

    expect(board.stations.map((s) => s.name)).toEqual(["Station 01", "Station 02"]);
    expect(board.stations[0]).toMatchObject({ maxCheckIns: 8, console: "PS5" });
    expect(board.stations[0].players).toEqual([
      expect.objectContaining({ fullName: "Playing Now", memberCode: "SQ-AAAAA", startedAt: expect.any(Date) }),
    ]);
    expect(board.stations[1].players).toEqual([]);
    expect(board.now).toBeInstanceOf(Date);
  });
});
