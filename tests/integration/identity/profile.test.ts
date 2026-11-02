import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import type { ProfileInput } from "@/lib/validation/identity";
import { changeGamerPassword, memberQrSvg, updateGamerProfile } from "@/server/identity/gamers";
import { verifyPassword } from "@/server/identity/password";
import { createSession, resolveGamerSession } from "@/server/identity/session";
import { insertGamer, resetDb } from "../../support/db";

beforeEach(resetDb);

const YEAR = 2026;

const profile = (overrides: Partial<ProfileInput> = {}): ProfileInput => ({
  fullName: "Arjun R",
  email: "arjun.new@example.com",
  phone: "+919000000001",
  birthYear: 1999,
  gender: "male",
  area: "Dilsukhnagar",
  pincode: "500060",
  referralSource: "google",
  favouriteGames: ["Tekken 8"],
  ...overrides,
});

const reload = async (id: string) =>
  (await db.select().from(schema.gamers).where(eq(schema.gamers.id, id)))[0];

describe("updateGamerProfile", () => {
  it("saves the new details", async () => {
    const gamer = await insertGamer();

    expect(await updateGamerProfile(gamer.id, profile(), YEAR)).toEqual({ ok: true });
    expect(await reload(gamer.id)).toMatchObject({ fullName: "Arjun R", email: "arjun.new@example.com", area: "Dilsukhnagar" });
  });

  it("refuses an email another gamer already uses", async () => {
    await insertGamer({ email: "taken@example.com" });
    const gamer = await insertGamer();

    expect(await updateGamerProfile(gamer.id, profile({ email: "taken@example.com" }), YEAR)).toEqual({
      ok: false,
      reason: "email_taken",
    });
  });

  it("refuses a birth year that makes the gamer a possible minor without guardian consent", async () => {
    const gamer = await insertGamer({ birthYear: 2000 });

    expect(await updateGamerProfile(gamer.id, profile({ birthYear: YEAR - 15 }), YEAR)).toEqual({
      ok: false,
      reason: "guardian_needed",
    });
  });
});

describe("changeGamerPassword", () => {
  it("needs the current password", async () => {
    const gamer = await insertGamer();

    expect(await changeGamerPassword(gamer.id, "wrong", "brand-new-pass")).toEqual({ ok: false, reason: "wrong_password" });
  });

  it("sets the new password and signs out every existing session", async () => {
    const gamer = await insertGamer();
    const { token } = await createSession({ gamerId: gamer.id });

    expect(await changeGamerPassword(gamer.id, "gamer-password", "brand-new-pass")).toEqual({ ok: true });
    expect(await verifyPassword("brand-new-pass", (await reload(gamer.id)).passwordHash)).toBe(true);
    expect(await resolveGamerSession(token)).toBeNull();
  });
});

describe("memberQrSvg", () => {
  it("renders an SVG for the member code", async () => {
    expect(await memberQrSvg("SQ-7K2QM")).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
  });
});
