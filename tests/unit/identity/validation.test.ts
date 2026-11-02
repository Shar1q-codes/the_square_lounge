import { describe, expect, it } from "vitest";
import { createStaffSchema, signUpSchema } from "@/lib/validation/identity";

const YEAR = 2026;

const validForm = {
  fullName: "Arjun Reddy",
  email: "Arjun@Example.com",
  phone: "98765 43210",
  password: "secret-pass-1",
  birthYear: "2000",
  gender: "",
  area: "Malakpet",
  pincode: "500036",
  referralSource: "instagram",
  favouriteGames: "FC 25, Tekken 8",
  agreeTerms: "on",
};

const parse = (overrides: Record<string, string | undefined> = {}) =>
  signUpSchema(YEAR).safeParse({ ...validForm, ...overrides });

const errorFields = (overrides: Record<string, string | undefined>) => {
  const result = parse(overrides);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("signUpSchema", () => {
  it("accepts a valid form and normalises it", () => {
    const result = parse();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      email: "arjun@example.com",
      phone: "+919876543210",
      birthYear: 2000,
      gender: null,
      favouriteGames: ["FC 25", "Tekken 8"],
      marketingOptIn: false,
      guardianConsent: false,
    });
  });

  it("requires agreeing to the privacy notice", () => {
    expect(errorFields({ agreeTerms: undefined })).toContain("agreeTerms");
  });

  it("rejects an invalid mobile number", () => {
    expect(errorFields({ phone: "12345" })).toContain("phone");
  });

  it("rejects a pincode starting with 0", () => {
    expect(errorFields({ pincode: "050036" })).toContain("pincode");
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(errorFields({ password: "short" })).toContain("password");
  });

  it("rejects gamers younger than 13", () => {
    expect(errorFields({ birthYear: String(YEAR - 12) })).toContain("birthYear");
  });

  it("requires guardian consent for anyone who may still be under 18", () => {
    expect(errorFields({ birthYear: String(YEAR - 15) })).toContain("guardianConsent");
    expect(errorFields({ birthYear: String(YEAR - 18) })).toContain("guardianConsent");
  });

  it("accepts a minor when a guardian agrees", () => {
    expect(parse({ birthYear: String(YEAR - 15), guardianConsent: "on" }).success).toBe(true);
  });

  it("does not ask adults for guardian consent", () => {
    expect(parse({ birthYear: String(YEAR - 19) }).success).toBe(true);
  });

  it("treats a ticked marketing box as opt-in", () => {
    const result = parse({ marketingOptIn: "on" });
    expect(result.success && result.data.marketingOptIn).toBe(true);
  });
});

describe("createStaffSchema", () => {
  it("accepts a lower-case username and a known role", () => {
    const result = createStaffSchema.safeParse({
      username: "Counter.Ravi",
      displayName: "Ravi",
      role: "staff",
      password: "temp-pass-123",
    });
    expect(result.success && result.data.username).toBe("counter.ravi");
  });

  it("rejects unknown roles", () => {
    const result = createStaffSchema.safeParse({
      username: "ravi",
      displayName: "Ravi",
      role: "owner",
      password: "temp-pass-123",
    });
    expect(result.success).toBe(false);
  });
});
