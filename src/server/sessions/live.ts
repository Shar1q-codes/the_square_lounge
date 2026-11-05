import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { findGame } from "@/lib/games";

/** Sets or changes the game on the gamer's open session. False when they aren't checked in. */
export async function setMyGame(gamerId: string, game: string | null): Promise<boolean> {
  const updated = await db
    .update(schema.playSessions)
    .set({ game, updatedAt: new Date() })
    .where(and(eq(schema.playSessions.gamerId, gamerId), eq(schema.playSessions.status, "open")))
    .returning({ id: schema.playSessions.id });
  return updated.length > 0;
}

export type LiveStation = { id: number; busy: boolean; game: string | null };

/**
 * For the public 3D lounge: which stations are in use and what's on. No names or times, so
 * nothing about who is playing leaves the server. The game is the latest one set at the station.
 */
export async function liveStations(): Promise<LiveStation[]> {
  const rows = await db
    .select({
      id: schema.stations.id,
      sessions: sql<number>`count(${schema.playSessions.id})`.mapWith(Number),
      game: sql<string | null>`(array_agg(${schema.playSessions.game} order by ${schema.playSessions.updatedAt} desc)
        filter (where ${schema.playSessions.game} is not null))[1]`,
    })
    .from(schema.stations)
    .leftJoin(
      schema.playSessions,
      and(eq(schema.playSessions.stationId, schema.stations.id), eq(schema.playSessions.status, "open")),
    )
    .where(eq(schema.stations.active, true))
    .groupBy(schema.stations.id)
    .orderBy(desc(schema.stations.id));
  return rows
    .map((r) => ({ id: r.id, busy: r.sessions > 0, game: findGame(r.game) ? r.game : null }))
    .sort((a, b) => a.id - b.id);
}
