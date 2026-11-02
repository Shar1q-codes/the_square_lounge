import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { writeAudit } from "@/server/identity/audit";
import { isUniqueViolation } from "@/server/identity/gamers";

export type CheckInResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "already_playing"; stationName: string; startedAt: Date }
  | { ok: false; reason: "station_full" | "station_inactive" | "gamer_not_found" };

/** Starts a session. Locks the station row so two counters can't fill the last seat together. */
export async function checkIn(staffId: string, gamerId: string, stationId: number): Promise<CheckInResult> {
  try {
    return await db.transaction(async (tx) => {
      const [station] = await tx
        .select()
        .from(schema.stations)
        .where(eq(schema.stations.id, stationId))
        .for("update");
      if (!station?.active) return { ok: false, reason: "station_inactive" } as const;

      const [gamer] = await tx
        .select({ id: schema.gamers.id })
        .from(schema.gamers)
        .where(and(eq(schema.gamers.id, gamerId), isNull(schema.gamers.deletedAt)));
      if (!gamer) return { ok: false, reason: "gamer_not_found" } as const;

      const [current] = await tx
        .select({ stationName: schema.stations.name, startedAt: schema.playSessions.startedAt })
        .from(schema.playSessions)
        .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
        .where(and(eq(schema.playSessions.gamerId, gamerId), eq(schema.playSessions.status, "open")));
      if (current) return { ok: false, reason: "already_playing", ...current } as const;

      const [{ seated }] = await tx
        .select({ seated: count() })
        .from(schema.playSessions)
        .where(and(eq(schema.playSessions.stationId, stationId), eq(schema.playSessions.status, "open")));
      if (seated >= station.maxCheckIns) return { ok: false, reason: "station_full" } as const;

      const [session] = await tx
        .insert(schema.playSessions)
        .values({ gamerId, stationId, startedBy: staffId })
        .returning({ id: schema.playSessions.id });
      await writeAudit(
        { actorStaffId: staffId, action: "session.check_in", targetType: "play_session", targetId: session.id, details: { stationId } },
        tx,
      );
      return { ok: true, sessionId: session.id } as const;
    });
  } catch (error) {
    // The same gamer checked in at two stations at the same moment: the unique index caught it.
    if (isUniqueViolation(error, "play_sessions_one_open_per_gamer")) return checkIn(staffId, gamerId, stationId);
    throw error;
  }
}
