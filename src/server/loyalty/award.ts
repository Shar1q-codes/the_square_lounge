import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { schema, type Executor } from "@/db";
import { pointsFor } from "@/lib/loyalty";
import { minutesBetween } from "@/lib/sessions";
import type { ClosedSession } from "@/server/sessions/checkOut";
import { addLedgerEntry } from "./ledger";

/** Points for freshly closed sessions. Called inside the check-out transaction. */
export async function awardForSessions(tx: Executor, sessions: ClosedSession[]) {
  for (const s of sessions) {
    await addLedgerEntry(tx, { gamerId: s.gamerId, delta: pointsFor(s.minutes, s.console), reason: "session", sessionId: s.id });
  }
}

/**
 * After an admin correction: brings the session's total points to what its new times earn,
 * writing only the difference. Called inside the correction transaction.
 */
export async function reawardSession(tx: Executor, sessionId: string, actorStaffId: string) {
  const [session] = await tx
    .select({
      gamerId: schema.playSessions.gamerId,
      status: schema.playSessions.status,
      startedAt: schema.playSessions.startedAt,
      endedAt: schema.playSessions.endedAt,
      console: schema.stations.console,
    })
    .from(schema.playSessions)
    .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
    .where(eq(schema.playSessions.id, sessionId));
  if (!session || session.status !== "closed" || !session.endedAt) return;

  const [{ awarded }] = await tx
    .select({ awarded: sql<number>`coalesce(sum(${schema.pointsLedger.delta}), 0)::int` })
    .from(schema.pointsLedger)
    .where(and(eq(schema.pointsLedger.sessionId, sessionId), inArray(schema.pointsLedger.reason, ["session", "correction"])));

  const target = pointsFor(minutesBetween(session.startedAt, session.endedAt), session.console);
  await addLedgerEntry(tx, { gamerId: session.gamerId, delta: target - awarded, reason: "correction", sessionId, actorStaffId });
}
