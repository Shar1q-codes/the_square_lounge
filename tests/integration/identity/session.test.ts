import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { authorize } from "@/server/identity/guards";
import { isLockedOut, recordLoginAttempt } from "@/server/identity/lockout";
import {
  createSession,
  resolveGamerSession,
  resolveStaffSession,
  revokeGamerSessions,
  revokeSession,
} from "@/server/identity/session";
import { insertGamer, insertStaff, resetDb } from "../../support/db";

beforeEach(resetDb);

describe("sessions", () => {
  it("resolves a fresh gamer session to that gamer", async () => {
    const gamer = await insertGamer();
    const { token } = await createSession({ gamerId: gamer.id });

    expect((await resolveGamerSession(token))?.id).toBe(gamer.id);
  });

  it("stores only a hash of the token", async () => {
    const gamer = await insertGamer();
    const { token } = await createSession({ gamerId: gamer.id });
    const rows = await db.select().from(schema.authSessions);

    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toContain(token);
  });

  it("does not accept a gamer token as a staff session, or the other way round", async () => {
    const gamer = await insertGamer();
    const member = await insertStaff();
    const gamerToken = (await createSession({ gamerId: gamer.id })).token;
    const staffToken = (await createSession({ staffId: member.id })).token;

    expect(await resolveStaffSession(gamerToken)).toBeNull();
    expect(await resolveGamerSession(staffToken)).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const gamer = await insertGamer();
    const { token } = await createSession({ gamerId: gamer.id }, new Date(Date.now() - 31 * 24 * 3600 * 1000));

    expect(await resolveGamerSession(token)).toBeNull();
  });

  it("gives staff sessions a 12-hour life", async () => {
    const member = await insertStaff();
    const now = new Date("2026-11-03T10:00:00Z");
    const { expiresAt } = await createSession({ staffId: member.id }, now);

    expect(expiresAt.toISOString()).toBe("2026-11-03T22:00:00.000Z");
  });

  it("rejects a revoked session", async () => {
    const gamer = await insertGamer();
    const { token } = await createSession({ gamerId: gamer.id });
    await revokeSession(token);

    expect(await resolveGamerSession(token)).toBeNull();
  });

  it("revokes every session of a gamer at once", async () => {
    const gamer = await insertGamer();
    const a = (await createSession({ gamerId: gamer.id })).token;
    const b = (await createSession({ gamerId: gamer.id })).token;
    await revokeGamerSessions(gamer.id);

    expect(await resolveGamerSession(a)).toBeNull();
    expect(await resolveGamerSession(b)).toBeNull();
  });

  it("rejects sessions of deactivated staff", async () => {
    const member = await insertStaff();
    const { token } = await createSession({ staffId: member.id });
    await db.update(schema.staff).set({ active: false }).where(eq(schema.staff.id, member.id));

    expect(await resolveStaffSession(token)).toBeNull();
  });

  it("rejects sessions of deleted gamer accounts", async () => {
    const gamer = await insertGamer();
    const { token } = await createSession({ gamerId: gamer.id });
    await db.update(schema.gamers).set({ deletedAt: new Date() }).where(eq(schema.gamers.id, gamer.id));

    expect(await resolveGamerSession(token)).toBeNull();
  });

  it("returns null for unknown or empty tokens", async () => {
    expect(await resolveGamerSession("not-a-real-token")).toBeNull();
    expect(await resolveGamerSession(undefined)).toBeNull();
  });
});

describe("login lockout", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

  it("locks after 5 failures within 15 minutes", async () => {
    for (let i = 0; i < 5; i++) await recordLoginAttempt("gamer", "a@example.com", false, minutesAgo(10 - i));

    expect(await isLockedOut("gamer", "a@example.com", now)).toBe(true);
  });

  it("does not lock after 4 failures", async () => {
    for (let i = 0; i < 4; i++) await recordLoginAttempt("gamer", "a@example.com", false, minutesAgo(5));

    expect(await isLockedOut("gamer", "a@example.com", now)).toBe(false);
  });

  it("ignores failures older than 15 minutes", async () => {
    for (let i = 0; i < 5; i++) await recordLoginAttempt("gamer", "a@example.com", false, minutesAgo(16 + i));

    expect(await isLockedOut("gamer", "a@example.com", now)).toBe(false);
  });

  it("starts counting again after a successful login", async () => {
    for (let i = 0; i < 4; i++) await recordLoginAttempt("gamer", "a@example.com", false, minutesAgo(12));
    await recordLoginAttempt("gamer", "a@example.com", true, minutesAgo(11));
    await recordLoginAttempt("gamer", "a@example.com", false, minutesAgo(10));

    expect(await isLockedOut("gamer", "a@example.com", now)).toBe(false);
  });

  it("keeps gamer and staff identifiers separate", async () => {
    for (let i = 0; i < 5; i++) await recordLoginAttempt("staff", "ravi", false, minutesAgo(1));

    expect(await isLockedOut("gamer", "ravi", now)).toBe(false);
    expect(await isLockedOut("staff", "ravi", now)).toBe(true);
  });
});

describe("authorize", () => {
  const gamer = { kind: "gamer" as const };
  const staffMember = { kind: "staff" as const, role: "staff" as const };
  const admin = { kind: "staff" as const, role: "admin" as const };

  it("sends visitors without a gamer session to /login", () => {
    expect(authorize(null, "gamer")).toEqual({ ok: false, redirectTo: "/login" });
  });

  it("lets gamers into gamer pages", () => {
    expect(authorize(gamer, "gamer")).toEqual({ ok: true });
  });

  it("sends non-staff to /staff/login", () => {
    expect(authorize(null, "staff")).toEqual({ ok: false, redirectTo: "/staff/login" });
  });

  it("lets staff and admins into staff pages", () => {
    expect(authorize(staffMember, "staff")).toEqual({ ok: true });
    expect(authorize(admin, "staff")).toEqual({ ok: true });
  });

  it("keeps plain staff out of admin pages", () => {
    expect(authorize(staffMember, "admin")).toEqual({ ok: false, redirectTo: "/staff" });
    expect(authorize(admin, "admin")).toEqual({ ok: true });
  });
});
