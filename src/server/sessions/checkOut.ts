import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { canVoid, minutesBetween } from "@/lib/sessions";
import { writeAudit } from "@/server/identity/audit";

export type CheckOutTarget = { sessionId: string } | { stationId: number };
export type PaymentInput = { amountPaise: number | null; method: "cash" | "upi" | "card" | "other" | null };

/** What `loyalty` needs to award points for a finished session. */
export type ClosedSession = {
  id: string;
  gamerId: string;
  stationId: number;
  console: "PS5" | "PS4";
  startedAt: Date;
  endedAt: Date;
  minutes: number;
};

export type CloseResult =
  | { ok: true; paymentId: string; sessions: ClosedSession[] }
  | { ok: false; reason: "nothing_open" };

/**
 * Ends one session or every open session at a station, with one payment and the same end time
 * (the transaction's database clock), and returns the closed sessions.
 */
export async function closeSessions(staffId: string, target: CheckOutTarget, payment: PaymentInput): Promise<CloseResult> {
  return db.transaction(async (tx) => {
    const matches =
      "sessionId" in target
        ? eq(schema.playSessions.id, target.sessionId)
        : eq(schema.playSessions.stationId, target.stationId);
    const open = await tx
      .select({ id: schema.playSessions.id, stationId: schema.playSessions.stationId })
      .from(schema.playSessions)
      .where(and(matches, eq(schema.playSessions.status, "open")))
      .for("update");
    if (open.length === 0) return { ok: false, reason: "nothing_open" } as const;

    const [created] = await tx
      .insert(schema.payments)
      .values({ stationId: open[0].stationId, amountPaise: payment.amountPaise, method: payment.method, recordedBy: staffId })
      .returning({ id: schema.payments.id });

    const ids = open.map((s) => s.id);
    const closed = await tx
      .update(schema.playSessions)
      .set({ status: "closed", endedAt: sql`now()`, endedBy: staffId, paymentId: created.id, updatedAt: sql`now()` })
      .where(inArray(schema.playSessions.id, ids))
      .returning();

    const consoles = await tx
      .select({ id: schema.stations.id, console: schema.stations.console })
      .from(schema.stations)
      .where(inArray(schema.stations.id, [...new Set(closed.map((s) => s.stationId))]));
    const consoleOf = new Map(consoles.map((c) => [c.id, c.console]));

    await writeAudit(
      {
        actorStaffId: staffId,
        action: "session.check_out",
        targetType: "play_session",
        targetId: ids.length === 1 ? ids[0] : undefined,
        details: { sessionIds: ids, paymentId: created.id, amountPaise: payment.amountPaise, method: payment.method },
      },
      tx,
    );

    return {
      ok: true,
      paymentId: created.id,
      sessions: closed.map((s) => ({
        id: s.id,
        gamerId: s.gamerId,
        stationId: s.stationId,
        console: consoleOf.get(s.stationId)!,
        startedAt: s.startedAt,
        endedAt: s.endedAt!,
        minutes: minutesBetween(s.startedAt, s.endedAt!),
      })),
    } as const;
  });
}

export type VoidResult = { ok: true } | { ok: false; reason: "not_open" | "too_late" };

/** Cancels a mistaken check-in within 15 minutes. The row stays, marked voided. */
export async function voidSession(staffId: string, sessionId: string, reason: string): Promise<VoidResult> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ startedAt: schema.playSessions.startedAt, status: schema.playSessions.status, now: sql<Date>`now()`.mapWith((v) => new Date(v)) })
      .from(schema.playSessions)
      .where(eq(schema.playSessions.id, sessionId))
      .for("update");
    if (!row || row.status !== "open") return { ok: false, reason: "not_open" } as const;
    if (!canVoid(row.startedAt, row.now)) return { ok: false, reason: "too_late" } as const;

    await tx
      .update(schema.playSessions)
      .set({ status: "voided", endedAt: sql`now()`, endedBy: staffId, voidReason: reason, updatedAt: sql`now()` })
      .where(eq(schema.playSessions.id, sessionId));
    await writeAudit(
      { actorStaffId: staffId, action: "session.void", targetType: "play_session", targetId: sessionId, details: { reason } },
      tx,
    );
    return { ok: true } as const;
  });
}
