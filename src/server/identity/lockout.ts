import "server-only";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";

export const MAX_FAILURES = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

type LoginKind = "gamer" | "staff";

export async function recordLoginAttempt(kind: LoginKind, identifier: string, succeeded: boolean, now = new Date()) {
  await db.insert(schema.loginAttempts).values({ kind, identifier, succeeded, createdAt: now });
}

/** True after MAX_FAILURES failures in the last 15 minutes, counting only since the last success. */
export async function isLockedOut(kind: LoginKind, identifier: string, now = new Date()): Promise<boolean> {
  const windowStart = new Date(now.getTime() - LOCKOUT_MS);
  const forThis = and(
    eq(schema.loginAttempts.kind, kind),
    eq(schema.loginAttempts.identifier, identifier),
    gt(schema.loginAttempts.createdAt, windowStart),
  );

  const [lastSuccess] = await db
    .select({ at: schema.loginAttempts.createdAt })
    .from(schema.loginAttempts)
    .where(and(forThis, eq(schema.loginAttempts.succeeded, true)))
    .orderBy(desc(schema.loginAttempts.createdAt))
    .limit(1);

  const [{ failures }] = await db
    .select({ failures: count() })
    .from(schema.loginAttempts)
    .where(
      and(
        forThis,
        eq(schema.loginAttempts.succeeded, false),
        lastSuccess ? gt(schema.loginAttempts.createdAt, lastSuccess.at) : undefined,
      ),
    );

  return failures >= MAX_FAILURES;
}
