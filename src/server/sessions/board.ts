import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export type BoardPlayer = {
  sessionId: string;
  gamerId: string;
  fullName: string | null;
  memberCode: string;
  startedAt: Date;
  game: string | null;
};
export type BoardStation = { id: number; name: string; console: "PS5" | "PS4"; maxCheckIns: number; players: BoardPlayer[] };

/** Active stations with who is playing right now, plus the database clock for timers. */
export async function getBoard(): Promise<{ now: Date; stations: BoardStation[] }> {
  const rows = await db
    .select({
      station: schema.stations,
      sessionId: schema.playSessions.id,
      gamerId: schema.gamers.id,
      fullName: schema.gamers.fullName,
      memberCode: schema.gamers.memberCode,
      startedAt: schema.playSessions.startedAt,
      game: schema.playSessions.game,
      now: sql<string>`now()`,
    })
    .from(schema.stations)
    .leftJoin(
      schema.playSessions,
      and(eq(schema.playSessions.stationId, schema.stations.id), eq(schema.playSessions.status, "open")),
    )
    .leftJoin(schema.gamers, eq(schema.gamers.id, schema.playSessions.gamerId))
    .where(eq(schema.stations.active, true))
    .orderBy(asc(schema.stations.id), asc(schema.playSessions.startedAt));

  const stations = new Map<number, BoardStation>();
  for (const row of rows) {
    const { id, name, console, maxCheckIns } = row.station;
    const station = stations.get(id) ?? { id, name, console, maxCheckIns, players: [] };
    stations.set(id, station);
    if (row.sessionId && row.gamerId && row.memberCode && row.startedAt) {
      station.players.push({
        sessionId: row.sessionId,
        gamerId: row.gamerId,
        fullName: row.fullName,
        memberCode: row.memberCode,
        startedAt: row.startedAt,
        game: row.game,
      });
    }
  }
  return { now: rows[0] ? new Date(rows[0].now) : new Date(), stations: [...stations.values()] };
}
