import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { ageBand, findGamers, setGamerTemporaryPassword, verifyGamerLogin } from "@/server/identity/gamers";
import { createSession, resolveGamerSession } from "@/server/identity/session";
import { insertGamer, insertStaff, resetDb } from "../../support/db";

beforeEach(resetDb);

describe("findGamers", () => {
  it("finds by member code, typed loosely", async () => {
    const member = await insertStaff();
    const gamer = await insertGamer({ memberCode: "SQ-7K2QM" });

    expect((await findGamers(member.id, "sq 7k2qm")).map((g) => g.id)).toEqual([gamer.id]);
  });

  it("finds by email, ignoring case", async () => {
    const member = await insertStaff();
    const gamer = await insertGamer({ email: "arjun@example.com" });

    expect((await findGamers(member.id, "Arjun@Example.com")).map((g) => g.id)).toEqual([gamer.id]);
  });

  it("finds every gamer sharing a mobile number", async () => {
    const member = await insertStaff();
    await insertGamer({ phone: "+919876543210" });
    await insertGamer({ phone: "+919876543210" });
    await insertGamer({ phone: "+919000000000" });

    expect(await findGamers(member.id, "98765 43210")).toHaveLength(2);
  });

  it("does not do partial matches or return deleted accounts", async () => {
    const member = await insertStaff();
    await insertGamer({ email: "arjun@example.com" });
    await insertGamer({ email: "gone@example.com", deletedAt: new Date() });

    expect(await findGamers(member.id, "arjun")).toEqual([]);
    expect(await findGamers(member.id, "gone@example.com")).toEqual([]);
  });

  it("returns a summary with an age band instead of the birth year", async () => {
    const member = await insertStaff();
    await insertGamer({ memberCode: "SQ-7K2QM", birthYear: 2004, fullName: "Arjun" });
    const [found] = await findGamers(member.id, "SQ-7K2QM");

    expect(found).toMatchObject({ fullName: "Arjun", memberCode: "SQ-7K2QM", area: "Malakpet" });
    expect(found).toHaveProperty("ageBand");
    expect(found).not.toHaveProperty("birthYear");
    expect(found).not.toHaveProperty("passwordHash");
  });

  it("audits each lookup without storing what was searched", async () => {
    const member = await insertStaff();
    await insertGamer({ email: "arjun@example.com" });
    await findGamers(member.id, "arjun@example.com");
    const [entry] = await db.select().from(schema.auditLog);

    expect(entry).toMatchObject({ action: "gamer.lookup", actorStaffId: member.id, details: { by: "email", results: 1 } });
    expect(JSON.stringify(entry)).not.toContain("arjun@example.com");
  });
});

describe("ageBand", () => {
  it.each([
    [2012, "13–17"],
    [2008, "18–24"],
    [1995, "25–34"],
    [1980, "35+"],
    [null, "Unknown"],
  ])("puts birth year %s in band %s", (birthYear, band) => {
    expect(ageBand(birthYear, 2026)).toBe(band);
  });
});

describe("setGamerTemporaryPassword", () => {
  it("lets the gamer log in with the new password, ends old sessions and audits it", async () => {
    const member = await insertStaff();
    const gamer = await insertGamer({ email: "arjun@example.com" });
    const { token } = await createSession({ gamerId: gamer.id });
    await setGamerTemporaryPassword(member.id, gamer.id, "counter-temp-1");

    expect((await verifyGamerLogin("arjun@example.com", "counter-temp-1")).ok).toBe(true);
    expect(await resolveGamerSession(token)).toBeNull();
    const entries = await db.select().from(schema.auditLog).where(eq(schema.auditLog.action, "gamer.temp_password"));
    expect(entries).toHaveLength(1);
  });
});
