import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Gamer, Staff } from "@/db/schema";

const DAY = 24 * 60 * 60 * 1000;
export const GAMER_SESSION_MS = 30 * DAY;
export const STAFF_SESSION_MS = 12 * 60 * 60 * 1000;

type Subject = { gamerId: string; staffId?: never } | { staffId: string; gamerId?: never };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a session and returns the raw token (only ever sent to the browser, never stored). */
export async function createSession(subject: Subject, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + (subject.gamerId ? GAMER_SESSION_MS : STAFF_SESSION_MS));
  await db.insert(schema.authSessions).values({
    tokenHash: hashToken(token),
    gamerId: subject.gamerId ?? null,
    staffId: subject.staffId ?? null,
    expiresAt,
    createdAt: now,
  });
  return { token, expiresAt };
}

/** The gamer behind a token, unless it expired, was revoked, or the account was deleted. */
export async function resolveGamerSession(token: string | undefined): Promise<Gamer | null> {
  if (!token) return null;
  const [row] = await db
    .select({ gamer: schema.gamers })
    .from(schema.authSessions)
    .innerJoin(schema.gamers, eq(schema.gamers.id, schema.authSessions.gamerId))
    .where(
      and(
        eq(schema.authSessions.tokenHash, hashToken(token)),
        gt(schema.authSessions.expiresAt, new Date()),
        isNull(schema.gamers.deletedAt),
      ),
    )
    .limit(1);
  return row?.gamer ?? null;
}

/** The staff member behind a token, unless it expired, was revoked, or they were deactivated. */
export async function resolveStaffSession(token: string | undefined): Promise<Staff | null> {
  if (!token) return null;
  const [row] = await db
    .select({ staff: schema.staff })
    .from(schema.authSessions)
    .innerJoin(schema.staff, eq(schema.staff.id, schema.authSessions.staffId))
    .where(
      and(
        eq(schema.authSessions.tokenHash, hashToken(token)),
        gt(schema.authSessions.expiresAt, new Date()),
        eq(schema.staff.active, true),
      ),
    )
    .limit(1);
  return row?.staff ?? null;
}

export async function revokeSession(token: string) {
  await db.delete(schema.authSessions).where(eq(schema.authSessions.tokenHash, hashToken(token)));
}

export async function revokeGamerSessions(gamerId: string) {
  await db.delete(schema.authSessions).where(eq(schema.authSessions.gamerId, gamerId));
}

export async function revokeStaffSessions(staffId: string) {
  await db.delete(schema.authSessions).where(eq(schema.authSessions.staffId, staffId));
}
