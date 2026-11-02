import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { createStaffSchema } from "@/lib/validation/identity";
import type { z } from "zod";
import { writeAudit } from "./audit";
import { isUniqueViolation } from "./gamers";
import { isLockedOut, recordLoginAttempt } from "./lockout";
import { hashPassword, verifyPassword } from "./password";
import { revokeStaffSessions } from "./session";

export type StaffLoginResult = { ok: true; staffId: string } | { ok: false; reason: "invalid" | "locked" };

let dummyHash: Promise<string> | undefined;

export async function verifyStaffLogin(rawUsername: string, password: string): Promise<StaffLoginResult> {
  const username = rawUsername.trim().toLowerCase();
  if (!username) return { ok: false, reason: "invalid" };
  if (await isLockedOut("staff", username)) return { ok: false, reason: "locked" };

  const [member] = await db
    .select({ id: schema.staff.id, passwordHash: schema.staff.passwordHash, active: schema.staff.active })
    .from(schema.staff)
    .where(eq(schema.staff.username, username))
    .limit(1);

  dummyHash ??= hashPassword("timing-equaliser");
  const passwordOk = await verifyPassword(password, member?.passwordHash ?? (await dummyHash));
  const succeeded = passwordOk && !!member?.active;
  await recordLoginAttempt("staff", username, succeeded);
  return succeeded ? { ok: true, staffId: member.id } : { ok: false, reason: "invalid" };
}

/** Creates the first admin from the command line. Never overwrites an existing account. */
export async function seedAdmin(username: string, password: string): Promise<"created" | "exists"> {
  const rows = await db
    .insert(schema.staff)
    .values({ username: username.toLowerCase(), displayName: "Owner", passwordHash: await hashPassword(password), role: "admin" })
    .onConflictDoNothing({ target: schema.staff.username })
    .returning({ id: schema.staff.id });
  return rows.length ? "created" : "exists";
}

export function listStaff() {
  return db
    .select({
      id: schema.staff.id,
      username: schema.staff.username,
      displayName: schema.staff.displayName,
      role: schema.staff.role,
      active: schema.staff.active,
      createdAt: schema.staff.createdAt,
    })
    .from(schema.staff)
    .orderBy(asc(schema.staff.username));
}

export async function createStaffMember(
  actorId: string,
  input: z.output<typeof createStaffSchema>,
): Promise<{ ok: true; id: string } | { ok: false; reason: "username_taken" }> {
  try {
    const [created] = await db
      .insert(schema.staff)
      .values({
        username: input.username,
        displayName: input.displayName,
        role: input.role,
        passwordHash: await hashPassword(input.password),
      })
      .returning({ id: schema.staff.id });
    await writeAudit({
      actorStaffId: actorId,
      action: "staff.create",
      targetType: "staff",
      targetId: created.id,
      details: { username: input.username, role: input.role },
    });
    return { ok: true, id: created.id };
  } catch (error) {
    if (isUniqueViolation(error, "staff_username_unique")) return { ok: false, reason: "username_taken" };
    throw error;
  }
}

export async function setStaffActive(
  actorId: string,
  staffId: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; reason: "self" }> {
  if (!active && actorId === staffId) return { ok: false, reason: "self" };
  await db.update(schema.staff).set({ active, updatedAt: new Date() }).where(eq(schema.staff.id, staffId));
  if (!active) await revokeStaffSessions(staffId);
  await writeAudit({
    actorStaffId: actorId,
    action: active ? "staff.reactivate" : "staff.deactivate",
    targetType: "staff",
    targetId: staffId,
  });
  return { ok: true };
}

export async function resetStaffPassword(actorId: string, staffId: string, newPassword: string) {
  await db
    .update(schema.staff)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(schema.staff.id, staffId));
  await revokeStaffSessions(staffId);
  await writeAudit({ actorStaffId: actorId, action: "staff.reset_password", targetType: "staff", targetId: staffId });
}
