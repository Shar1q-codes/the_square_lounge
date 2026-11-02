import "server-only";
import { db, schema, type Executor } from "@/db";

type AuditEntry = {
  actorStaffId?: string;
  actorGamerId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  /** Never put passwords, tokens or full contact details here. */
  details?: Record<string, unknown>;
};

export async function writeAudit(entry: AuditEntry, executor: Executor = db) {
  await executor.insert(schema.auditLog).values({
    actorStaffId: entry.actorStaffId ?? null,
    actorGamerId: entry.actorGamerId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId ?? null,
    details: entry.details ?? null,
  });
}
