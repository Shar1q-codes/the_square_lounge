import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { getBoard } from "@/server/sessions/board";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions } from "@/server/sessions/checkOut";
import { liveStations, setMyGame } from "@/server/sessions/live";
import { insertGamer, insertStaff, insertStation, resetDb } from "../../support/db";

beforeEach(resetDb);

describe("games on stations", () => {
  it("keeps the game picked at check-in and shows it on the board", async () => {
    const member = await insertStaff();
    const station = await insertStation({ id: 1, name: "Station 01" });
    const gamer = await insertGamer();
    await checkIn(member.id, gamer.id, station.id, "ufc-5");

    const board = await getBoard();
    expect(board.stations[0].players[0].game).toBe("ufc-5");
  });

  it("lets a checked-in gamer set or change their game, and nobody else", async () => {
    const member = await insertStaff();
    const station = await insertStation({ id: 1 });
    const playing = await insertGamer();
    const outside = await insertGamer();
    await checkIn(member.id, playing.id, station.id);

    expect(await setMyGame(playing.id, "gta-v")).toBe(true);
    expect(await setMyGame(outside.id, "gta-v")).toBe(false);
    const [row] = await db.select().from(schema.playSessions).where(eq(schema.playSessions.gamerId, playing.id));
    expect(row.game).toBe("gta-v");
  });
});

describe("liveStations", () => {
  it("lists every active station as free or booked, with the latest game, and nothing personal", async () => {
    const member = await insertStaff();
    await insertStation({ id: 1, name: "Station 01" });
    await insertStation({ id: 2, name: "Station 02" });
    await insertStation({ id: 3, name: "Station 03" });
    await insertStation({ id: 9, name: "Retired", active: false });
    const [a, b, c] = [await insertGamer(), await insertGamer(), await insertGamer()];
    await checkIn(member.id, a.id, 1, "ea-fc-26");
    await checkIn(member.id, b.id, 1);
    await setMyGame(b.id, "ea-fc-27");
    await checkIn(member.id, c.id, 2);

    expect(await liveStations()).toEqual([
      { id: 1, busy: true, game: "ea-fc-27" },
      { id: 2, busy: true, game: null },
      { id: 3, busy: false, game: null },
    ]);
  });

  it("frees the station as soon as the player is checked out", async () => {
    const member = await insertStaff();
    await insertStation({ id: 1 });
    const gamer = await insertGamer();
    const session = await checkIn(member.id, gamer.id, 1, "mortal-kombat-1");
    if (!session.ok) throw new Error("check-in failed");
    await db.update(schema.playSessions).set({ startedAt: new Date(Date.now() - 600_000) });
    await closeSessions(member.id, { sessionId: session.sessionId }, { amountPaise: null, method: null });

    expect(await liveStations()).toEqual([{ id: 1, busy: false, game: null }]);
  });
});
