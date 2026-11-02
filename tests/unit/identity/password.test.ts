import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/identity/password";

describe("password hashing", () => {
  it("verifies the right password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(await verifyPassword("Correct horse battery", hash)).toBe(false);
  });

  it("salts every hash, so the same password hashes differently", async () => {
    expect(await hashPassword("same-password")).not.toBe(await hashPassword("same-password"));
  });

  it("never stores the password itself", async () => {
    expect(await hashPassword("plain-text-secret")).not.toContain("plain-text-secret");
  });

  it("returns false for a missing or malformed hash instead of throwing", async () => {
    expect(await verifyPassword("anything", null)).toBe(false);
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});
