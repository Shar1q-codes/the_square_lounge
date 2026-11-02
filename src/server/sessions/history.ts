import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { minutesBetween } from "@/lib/sessions";

/** Where the gamer is playing right now, if anywhere. */
export async function currentSession(gamerId: string): Promise<{ stationName: string; startedAt: Date } | null> {
  const [row] = await db
    .select({ stationName: schema.stations.name, startedAt: schema.playSessions.startedAt })
    .from(schema.playSessions)
    .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
    .where(and(eq(schema.playSessions.gamerId, gamerId), eq(schema.playSessions.status, "open")))
    .limit(1);
  return row ?? null;
}

export type Visit = { id: string; stationName: string; console: "PS5" | "PS4"; startedAt: Date; endedAt: Date; minutes: number };

/** The gamer's finished visits, newest first. Never includes what was paid. */
export async function recentVisits(gamerId: string, limit = 20): Promise<Visit[]> {
  const rows = await db
    .select({
      id: schema.playSessions.id,
      stationName: schema.stations.name,
      console: schema.stations.console,
      startedAt: schema.playSessions.startedAt,
      endedAt: schema.playSessions.endedAt,
    })
    .from(schema.playSessions)
    .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
    .where(and(eq(schema.playSessions.gamerId, gamerId), eq(schema.playSessions.status, "closed")))
    .orderBy(desc(schema.playSessions.startedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, endedAt: r.endedAt!, minutes: minutesBetween(r.startedAt, r.endedAt!) }));
}

/** Every session for "Download my data", including cancelled ones. */
export async function sessionsForExport(gamerId: string) {
  const rows = await db
    .select({
      station: schema.stations.name,
      status: schema.playSessions.status,
      startedAt: schema.playSessions.startedAt,
      endedAt: schema.playSessions.endedAt,
    })
    .from(schema.playSessions)
    .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
    .where(eq(schema.playSessions.gamerId, gamerId))
    .orderBy(asc(schema.playSessions.startedAt));
  return rows.map((r) => ({ ...r, minutes: r.endedAt ? minutesBetween(r.startedAt, r.endedAt) : null }));
}
