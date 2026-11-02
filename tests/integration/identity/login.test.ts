import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db, schema } from "@/db";
import { verifyGamerLogin } from "@/server/identity/gamers";
import { insertGamer, resetDb } from "../../support/db";

beforeEach(resetDb);

describe("verifyGamerLogin", () => {
  it("accepts the right email and password, ignoring email case", async () => {
    const gamer = await insertGamer({ email: "arjun@example.com" });

    expect(await verifyGamerLogin(" Arjun@Example.com ", "gamer-password")).toEqual({ ok: true, gamerId: gamer.id });
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await insertGamer({ email: "arjun@example.com" });

    expect(await verifyGamerLogin("arjun@example.com", "wrong-password")).toEqual({ ok: false, reason: "invalid" });
    expect(await verifyGamerLogin("nobody@example.com", "gamer-password")).toEqual({ ok: false, reason: "invalid" });
  });

  it("locks the email after 5 wrong passwords, even for the right one", async () => {
    await insertGamer({ email: "arjun@example.com" });
    for (let i = 0; i < 5; i++) await verifyGamerLogin("arjun@example.com", "wrong-password");

    expect(await verifyGamerLogin("arjun@example.com", "gamer-password")).toEqual({ ok: false, reason: "locked" });
  });

  it("refuses deleted accounts", async () => {
    const gamer = await insertGamer({ email: "arjun@example.com" });
    await db.update(schema.gamers).set({ deletedAt: new Date() }).where(eq(schema.gamers.id, gamer.id));

    expect(await verifyGamerLogin("arjun@example.com", "gamer-password")).toEqual({ ok: false, reason: "invalid" });
  });

  it("records each attempt without storing the password", async () => {
    await insertGamer({ email: "arjun@example.com" });
    await verifyGamerLogin("arjun@example.com", "wrong-password");
    await verifyGamerLogin("arjun@example.com", "gamer-password");
    const attempts = await db.select().from(schema.loginAttempts);

    expect(attempts.map((a) => [a.kind, a.identifier, a.succeeded])).toEqual([
      ["gamer", "arjun@example.com", false],
      ["gamer", "arjun@example.com", true],
    ]);
  });
});
