import { describe, expect, it } from "vitest";
import { generateMemberCode, normaliseMemberCode } from "@/server/identity/memberCode";

describe("generateMemberCode", () => {
  it("looks like SQ- followed by 5 unambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateMemberCode()).toMatch(/^SQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
    }
  });

  it("varies between calls", () => {
    const codes = new Set(Array.from({ length: 50 }, generateMemberCode));
    expect(codes.size).toBeGreaterThan(45);
  });
});

describe("normaliseMemberCode", () => {
  it.each(["SQ-7K2QM", "sq-7k2qm", " SQ 7K2QM ", "7k2qm"])("reads %s as SQ-7K2QM", (input) => {
    expect(normaliseMemberCode(input)).toBe("SQ-7K2QM");
  });

  it.each(["SQ-7K2Q", "SQ-7K2QMX", "SQ-0K2QM", "hello"])("rejects %s", (input) => {
    expect(normaliseMemberCode(input)).toBeNull();
  });
});
