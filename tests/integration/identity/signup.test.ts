import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { PRIVACY_NOTICE_VERSION } from "@/config/privacy";
import type { SignUpInput } from "@/lib/validation/identity";
import { registerGamer } from "@/server/identity/gamers";
import { verifyPassword } from "@/server/identity/password";
import { resetDb } from "../../support/db";

beforeEach(resetDb);

const input = (overrides: Partial<SignUpInput> = {}): SignUpInput => ({
  fullName: "Arjun Reddy",
  email: "arjun@example.com",
  phone: "+919876543210",
  password: "secret-pass-1",
  birthYear: 2000,
  gender: null,
  area: "Malakpet",
  pincode: "500036",
  referralSource: "instagram",
  favouriteGames: ["FC 25"],
  marketingOptIn: false,
  guardianConsent: false,
  agreeTerms: true,
  ...overrides,
});

const consentsOf = (gamerId: string) =>
  db.select().from(schema.consents).where(eq(schema.consents.gamerId, gamerId));

describe("registerGamer", () => {
  it("creates the gamer with a member code and a hashed password", async () => {
    const result = await registerGamer(input());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.gamer.memberCode).toMatch(/^SQ-[A-Z0-9]{5}$/);
    expect(result.gamer.passwordHash).not.toContain("secret-pass-1");
    expect(await verifyPassword("secret-pass-1", result.gamer.passwordHash)).toBe(true);
  });

  it("records service consent with the current notice version", async () => {
    const result = await registerGamer(input());
    if (!result.ok) throw new Error("sign-up failed");
    const rows = await consentsOf(result.gamer.id);

    expect(rows.map((r) => [r.purpose, r.granted, r.noticeVersion])).toEqual([
      ["service", true, PRIVACY_NOTICE_VERSION],
    ]);
  });

  it("also records marketing and guardian consent when given", async () => {
    const result = await registerGamer(input({ marketingOptIn: true, guardianConsent: true, birthYear: 2011 }));
    if (!result.ok) throw new Error("sign-up failed");
    const purposes = (await consentsOf(result.gamer.id)).map((r) => r.purpose).sort();

    expect(purposes).toEqual(["guardian", "marketing", "service"]);
    expect(result.gamer.marketingOptIn).toBe(true);
  });

  it("refuses a duplicate email and creates nothing", async () => {
    await registerGamer(input());
    const second = await registerGamer(input({ fullName: "Someone Else" }));

    expect(second).toEqual({ ok: false, reason: "email_taken" });
    expect(await db.select().from(schema.gamers)).toHaveLength(1);
    expect(await db.select().from(schema.consents)).toHaveLength(1);
  });

  it("lets two gamers share a mobile number", async () => {
    await registerGamer(input());
    const sibling = await registerGamer(input({ email: "sibling@example.com" }));

    expect(sibling.ok).toBe(true);
  });
});
