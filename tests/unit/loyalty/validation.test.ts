import { describe, expect, it } from "vitest";
import { adjustmentSchema, offerSchema } from "@/lib/validation/loyalty";

const form = {
  title: "Free PS4 hour",
  description: "",
  pointsCost: "100",
  category: "gaming",
  stock: "",
  maxPerGamer: "",
  startsAt: "",
  endsAt: "",
  active: "on",
};

describe("offerSchema", () => {
  it("reads blanks as no limit and no dates", () => {
    expect(offerSchema.safeParse(form)).toMatchObject({
      success: true,
      data: { pointsCost: 100, stock: null, maxPerGamer: null, startsAt: null, endsAt: null, active: true },
    });
  });

  it("reads dates as India time", () => {
    const result = offerSchema.safeParse({ ...form, startsAt: "2026-12-01T10:00", endsAt: "2026-12-31T22:00" });
    expect(result.success && result.data.startsAt?.toISOString()).toBe("2026-12-01T04:30:00.000Z");
  });

  it.each([
    ["pointsCost", "0"],
    ["pointsCost", "abc"],
    ["stock", "-1"],
    ["maxPerGamer", "0"],
    ["title", "x"],
  ])("rejects %s = %s", (field, value) => {
    expect(offerSchema.safeParse({ ...form, [field]: value }).success).toBe(false);
  });

  it("needs the end after the start", () => {
    expect(offerSchema.safeParse({ ...form, startsAt: "2026-12-31T10:00", endsAt: "2026-12-01T10:00" }).success).toBe(false);
  });
});

describe("adjustmentSchema", () => {
  it("accepts a signed whole number with a reason", () => {
    expect(adjustmentSchema.safeParse({ gamerId: "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f", points: "-50", reason: "Duplicate visit" })).toMatchObject({
      success: true,
      data: { points: -50 },
    });
  });

  it.each(["0", "10001", "2.5", ""])("rejects %s points", (points) => {
    expect(adjustmentSchema.safeParse({ gamerId: "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f", points, reason: "Because" }).success).toBe(false);
  });
});
