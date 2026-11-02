import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { deleteGamerAccount, exportGamerData, setMarketingConsent } from "@/server/identity/consent";
import { registerGamer, verifyGamerLogin } from "@/server/identity/gamers";
import { createSession, resolveGamerSession } from "@/server/identity/session";
import { insertGamer, resetDb } from "../../support/db";

beforeEach(resetDb);

const reload = async (id: string) =>
  (await db.select().from(schema.gamers).where(eq(schema.gamers.id, id)))[0];

describe("setMarketingConsent", () => {
  it("appends a consent row every time and updates the profile flag", async () => {
    const gamer = await insertGamer();
    await setMarketingConsent(gamer.id, true);
    await setMarketingConsent(gamer.id, false);

    const rows = await db.select().from(schema.consents).where(eq(schema.consents.gamerId, gamer.id));
    expect(rows.map((r) => [r.purpose, r.granted])).toEqual([
      ["marketing", true],
      ["marketing", false],
    ]);
    expect((await reload(gamer.id)).marketingOptIn).toBe(false);
  });
});

describe("exportGamerData", () => {
  it("includes the profile and consent history but never the password hash", async () => {
    const gamer = await insertGamer({ fullName: "Arjun Reddy" });
    await setMarketingConsent(gamer.id, true);
    const data = await exportGamerData(gamer.id);

    expect(data.profile).toMatchObject({ fullName: "Arjun Reddy", memberCode: gamer.memberCode });
    expect(data.consents).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain("scrypt$");
    expect(data.profile).not.toHaveProperty("passwordHash");
  });
});

describe("deleteGamerAccount", () => {
  it("needs the password", async () => {
    const gamer = await insertGamer();

    expect(await deleteGamerAccount(gamer.id, "wrong")).toEqual({ ok: false, reason: "wrong_password" });
    expect((await reload(gamer.id)).deletedAt).toBeNull();
  });

  it("erases personal details but keeps area and pincode for anonymous analytics", async () => {
    const gamer = await insertGamer({ gender: "male", favouriteGames: ["FC 25"] });

    expect(await deleteGamerAccount(gamer.id, "gamer-password")).toEqual({ ok: true });
    expect(await reload(gamer.id)).toMatchObject({
      email: null,
      passwordHash: null,
      fullName: null,
      phone: null,
      birthYear: null,
      gender: null,
      favouriteGames: [],
      marketingOptIn: false,
      area: "Malakpet",
      pincode: "500036",
    });
    expect((await reload(gamer.id)).deletedAt).toBeInstanceOf(Date);
  });

  it("signs out every session and blocks future logins", async () => {
    const gamer = await insertGamer({ email: "arjun@example.com" });
    const { token } = await createSession({ gamerId: gamer.id });
    await deleteGamerAccount(gamer.id, "gamer-password");

    expect(await resolveGamerSession(token)).toBeNull();
    expect((await verifyGamerLogin("arjun@example.com", "gamer-password")).ok).toBe(false);
  });

  it("frees the email so the person can sign up again", async () => {
    const gamer = await insertGamer({ email: "arjun@example.com" });
    await deleteGamerAccount(gamer.id, "gamer-password");

    const again = await registerGamer({
      fullName: "Arjun Again",
      email: "arjun@example.com",
      phone: "+919876543210",
      password: "another-pass",
      birthYear: 2000,
      gender: null,
      area: "Malakpet",
      pincode: "500036",
      referralSource: "friend",
      favouriteGames: [],
      marketingOptIn: false,
      guardianConsent: false,
      agreeTerms: true,
    });
    expect(again.ok).toBe(true);
  });

  it("writes an audit entry without personal details", async () => {
    const gamer = await insertGamer({ email: "arjun@example.com" });
    await deleteGamerAccount(gamer.id, "gamer-password");
    const [entry] = await db.select().from(schema.auditLog);

    expect(entry).toMatchObject({ action: "gamer.delete", targetType: "gamer", targetId: gamer.id });
    expect(JSON.stringify(entry)).not.toContain("arjun@example.com");
  });
});
