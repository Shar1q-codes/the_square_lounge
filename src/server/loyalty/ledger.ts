import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema, type Executor } from "@/db";
import { formatDuration, minutesBetween } from "@/lib/sessions";

export type LedgerEntry = {
  gamerId: string;
  delta: number;
  reason: "session" | "correction" | "redemption" | "refund" | "adjustment";
  sessionId?: string;
  voucherId?: string;
  note?: string;
  actorStaffId?: string;
};

/** The only way points change. Positive earns, negative spends. Runs inside the caller's transaction. */
export async function addLedgerEntry(tx: Executor, entry: LedgerEntry): Promise<void> {
  if (entry.delta === 0) return;
  await tx.insert(schema.pointsLedger).values({
    gamerId: entry.gamerId,
    delta: entry.delta,
    reason: entry.reason,
    sessionId: entry.sessionId ?? null,
    voucherId: entry.voucherId ?? null,
    note: entry.note ?? null,
    actorStaffId: entry.actorStaffId ?? null,
  });
}

export async function balanceOf(gamerId: string, executor: Executor = db): Promise<number> {
  const [row] = await executor
    .select({ balance: sql<number>`coalesce(sum(${schema.pointsLedger.delta}), 0)::int` })
    .from(schema.pointsLedger)
    .where(eq(schema.pointsLedger.gamerId, gamerId));
  return row.balance;
}

export type LedgerLine = { id: number; delta: number; reason: LedgerEntry["reason"]; description: string; createdAt: Date };

/** A member's points history, newest first, with a human description per line. */
export async function ledgerFor(gamerId: string, limit = 100): Promise<LedgerLine[]> {
  const rows = await db
    .select({
      id: schema.pointsLedger.id,
      delta: schema.pointsLedger.delta,
      reason: schema.pointsLedger.reason,
      note: schema.pointsLedger.note,
      createdAt: schema.pointsLedger.createdAt,
      startedAt: schema.playSessions.startedAt,
      endedAt: schema.playSessions.endedAt,
      stationName: schema.stations.name,
      offerTitle: schema.offers.title,
    })
    .from(schema.pointsLedger)
    .leftJoin(schema.playSessions, eq(schema.playSessions.id, schema.pointsLedger.sessionId))
    .leftJoin(schema.stations, eq(schema.stations.id, schema.playSessions.stationId))
    .leftJoin(schema.vouchers, eq(schema.vouchers.id, schema.pointsLedger.voucherId))
    .leftJoin(schema.offers, eq(schema.offers.id, schema.vouchers.offerId))
    .where(eq(schema.pointsLedger.gamerId, gamerId))
    .orderBy(desc(schema.pointsLedger.createdAt), desc(schema.pointsLedger.id))
    .limit(limit);

  return rows.map((r) => {
    const played = r.startedAt && r.endedAt ? formatDuration(minutesBetween(r.startedAt, r.endedAt)) : "";
    const description = {
      session: `Played ${played} at ${r.stationName ?? "the lounge"}`,
      correction: `Visit time corrected${r.stationName ? ` (${r.stationName})` : ""}`,
      redemption: `Claimed: ${r.offerTitle ?? "offer"}`,
      refund: `Refund: ${r.note ?? r.offerTitle ?? "voucher"}`,
      adjustment: `Adjustment: ${r.note ?? "by the lounge"}`,
    }[r.reason];
    return { id: r.id, delta: r.delta, reason: r.reason, description, createdAt: r.createdAt };
  });
}
