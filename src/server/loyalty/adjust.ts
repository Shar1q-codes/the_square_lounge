import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { writeAudit } from "@/server/identity/audit";
import { addLedgerEntry, balanceOf } from "./ledger";

/** Admin gift or fix: adds (or removes, if negative) points with a reason. */
export async function adjustPoints(
  adminId: string,
  gamerId: string,
  points: number,
  reason: string,
): Promise<{ ok: true; balance: number } | { ok: false; reason: "gamer_not_found" }> {
  return db.transaction(async (tx) => {
    const [gamer] = await tx
      .select({ id: schema.gamers.id })
      .from(schema.gamers)
      .where(and(eq(schema.gamers.id, gamerId), isNull(schema.gamers.deletedAt)))
      .for("update");
    if (!gamer) return { ok: false, reason: "gamer_not_found" } as const;

    await addLedgerEntry(tx, { gamerId, delta: points, reason: "adjustment", note: reason, actorStaffId: adminId });
    await writeAudit({ actorStaffId: adminId, action: "points.adjust", targetType: "gamer", targetId: gamerId, details: { points, reason } }, tx);
    return { ok: true, balance: await balanceOf(gamerId, tx) } as const;
  });
}
