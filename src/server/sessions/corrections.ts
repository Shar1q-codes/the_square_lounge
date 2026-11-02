import "server-only";
import { and, desc, eq, gt, lt, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { LONG_SESSION_MS } from "@/lib/sessions";
import { writeAudit } from "@/server/identity/audit";

export type AdminFilter = "open" | "attention" | "recent";

export type AdminSessionRow = {
  id: string;
  fullName: string | null;
  memberCode: string;
  stationName: string;
  status: "open" | "closed" | "voided";
  startedAt: Date;
  endedAt: Date | null;
  voidReason: string | null;
};

/** Sessions for the admin list: open now, open over 12 hours, or started in the last 7 days. */
export async function listSessionsForAdmin(filter: AdminFilter): Promise<AdminSessionRow[]> {
  const where: Record<AdminFilter, SQL | undefined> = {
    open: eq(schema.playSessions.status, "open"),
    attention: and(
      eq(schema.playSessions.status, "open"),
      lt(schema.playSessions.startedAt, sql`now() - ${`${LONG_SESSION_MS / 1000} seconds`}::interval`),
    ),
    recent: gt(schema.playSessions.startedAt, sql`now() - interval '7 days'`),
  };
  return db
    .select({
      id: schema.playSessions.id,
      fullName: schema.gamers.fullName,
      memberCode: schema.gamers.memberCode,
      stationName: schema.stations.name,
      status: schema.playSessions.status,
      startedAt: schema.playSessions.startedAt,
      endedAt: schema.playSessions.endedAt,
      voidReason: schema.playSessions.voidReason,
    })
    .from(schema.playSessions)
    .innerJoin(schema.gamers, eq(schema.gamers.id, schema.playSessions.gamerId))
    .innerJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
    .where(where[filter])
    .orderBy(desc(schema.playSessions.startedAt))
    .limit(200);
}

export type CorrectionInput = { sessionId: string; startedAt: Date; endedAt: Date; reason: string };
export type CorrectionResult = { ok: true } | { ok: false; reason: "not_found" | "voided" | "future" };

/**
 * Admin fix of a session's times (e.g. a forgotten check-out). Closes an open session.
 * Length rules are checked by the form schema; "not in the future" uses the database clock.
 */
export async function correctSession(adminId: string, input: CorrectionInput): Promise<CorrectionResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ session: schema.playSessions, now: sql<string>`now()` })
      .from(schema.playSessions)
      .where(eq(schema.playSessions.id, input.sessionId))
      .for("update");
    if (!row) return { ok: false, reason: "not_found" } as const;
    const { session } = row;
    if (session.status === "voided") return { ok: false, reason: "voided" } as const;
    if (input.endedAt.getTime() > new Date(row.now).getTime()) return { ok: false, reason: "future" } as const;

    await tx
      .update(schema.playSessions)
      .set({
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        status: "closed",
        endedBy: session.endedBy ?? adminId,
        updatedAt: sql`now()`,
      })
      .where(eq(schema.playSessions.id, session.id));

    await writeAudit(
      {
        actorStaffId: adminId,
        action: "session.correct",
        targetType: "play_session",
        targetId: session.id,
        details: {
          reason: input.reason,
          before: { status: session.status, startedAt: session.startedAt.toISOString(), endedAt: session.endedAt?.toISOString() ?? null },
          after: { status: "closed", startedAt: input.startedAt.toISOString(), endedAt: input.endedAt.toISOString() },
        },
      },
      tx,
    );
    return { ok: true } as const;
  });
}
