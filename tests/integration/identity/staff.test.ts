import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { createSession, resolveStaffSession } from "@/server/identity/session";
import {
  createStaffMember,
  resetStaffPassword,
  seedAdmin,
  setStaffActive,
  verifyStaffLogin,
} from "@/server/identity/staff";
import { insertStaff, resetDb } from "../../support/db";

beforeEach(resetDb);

const auditActions = async () => (await db.select().from(schema.auditLog)).map((a) => a.action);

describe("seedAdmin", () => {
  it("creates the admin once and does nothing on a second run", async () => {
    expect(await seedAdmin("owner", "owner-password-1")).toBe("created");
    expect(await seedAdmin("owner", "another-password")).toBe("exists");

    const rows = await db.select().from(schema.staff);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ username: "owner", role: "admin", active: true });
  });
});

describe("verifyStaffLogin", () => {
  it("accepts an active staff member's username (any case) and password", async () => {
    const member = await insertStaff({ username: "ravi" });

    expect(await verifyStaffLogin("RAVI", "staff-password")).toEqual({ ok: true, staffId: member.id });
  });

  it("refuses deactivated staff even with the right password", async () => {
    await insertStaff({ username: "ravi", active: false });

    expect(await verifyStaffLogin("ravi", "staff-password")).toEqual({ ok: false, reason: "invalid" });
  });

  it("locks the username after 5 failures", async () => {
    await insertStaff({ username: "ravi" });
    for (let i = 0; i < 5; i++) await verifyStaffLogin("ravi", "nope");

    expect(await verifyStaffLogin("ravi", "staff-password")).toEqual({ ok: false, reason: "locked" });
  });
});

describe("createStaffMember", () => {
  it("creates staff and audits it", async () => {
    const admin = await insertStaff({ role: "admin" });
    const result = await createStaffMember(admin.id, {
      username: "priya",
      displayName: "Priya",
      role: "staff",
      password: "temp-pass-123",
    });

    expect(result.ok).toBe(true);
    expect(await verifyStaffLogin("priya", "temp-pass-123")).toMatchObject({ ok: true });
    expect(await auditActions()).toEqual(["staff.create"]);
  });

  it("refuses a username that is taken", async () => {
    const admin = await insertStaff({ role: "admin", username: "boss" });

    expect(
      await createStaffMember(admin.id, { username: "boss", displayName: "X", role: "staff", password: "temp-pass-123" }),
    ).toEqual({ ok: false, reason: "username_taken" });
  });
});

describe("setStaffActive", () => {
  it("deactivating ends their sessions", async () => {
    const admin = await insertStaff({ role: "admin" });
    const member = await insertStaff();
    const { token } = await createSession({ staffId: member.id });

    expect(await setStaffActive(admin.id, member.id, false)).toEqual({ ok: true });
    expect(await resolveStaffSession(token)).toBeNull();
    expect(await auditActions()).toEqual(["staff.deactivate"]);
  });

  it("does not let an admin deactivate themselves", async () => {
    const admin = await insertStaff({ role: "admin" });

    expect(await setStaffActive(admin.id, admin.id, false)).toEqual({ ok: false, reason: "self" });
  });

  it("can reactivate", async () => {
    const admin = await insertStaff({ role: "admin" });
    const member = await insertStaff({ active: false });
    await setStaffActive(admin.id, member.id, true);

    expect((await db.select().from(schema.staff).where(eq(schema.staff.id, member.id)))[0].active).toBe(true);
  });
});

describe("resetStaffPassword", () => {
  it("sets a new password, ends their sessions and audits it", async () => {
    const admin = await insertStaff({ role: "admin" });
    const member = await insertStaff({ username: "ravi" });
    const { token } = await createSession({ staffId: member.id });
    await resetStaffPassword(admin.id, member.id, "fresh-temp-pass");

    expect(await verifyStaffLogin("ravi", "fresh-temp-pass")).toMatchObject({ ok: true });
    expect(await resolveStaffSession(token)).toBeNull();
    expect(await auditActions()).toEqual(["staff.reset_password"]);
  });
});
