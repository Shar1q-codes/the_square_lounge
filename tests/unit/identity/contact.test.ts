import { describe, expect, it } from "vitest";
import { normaliseEmail } from "@/server/identity/email";
import { normalisePhone } from "@/server/identity/phone";

describe("normalisePhone", () => {
  it.each(["9876543210", "+91 98765 43210", "09876543210", "919876543210", "+91-98765-43210", "(+91) 98765 43210"])(
    "stores %s as +919876543210",
    (input) => {
      expect(normalisePhone(input)).toBe("+919876543210");
    },
  );

  it.each(["5876543210", "987654321", "98765432101", "+1 9876543210", "abcdefghij", ""])("rejects %s", (input) => {
    expect(normalisePhone(input)).toBeNull();
  });
});

describe("normaliseEmail", () => {
  it("trims and lower-cases", () => {
    expect(normaliseEmail("  Gamer.One@Example.COM ")).toBe("gamer.one@example.com");
  });

  it.each(["", "no-at-sign", "a@b", "two@@example.com"])("rejects %s", (input) => {
    expect(normaliseEmail(input)).toBeNull();
  });
});
