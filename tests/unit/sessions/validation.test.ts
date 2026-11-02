import { describe, expect, it } from "vitest";
import { checkInSchema, checkOutSchema, correctionSchema, voidSchema } from "@/lib/validation/sessions";

const SESSION_ID = "6f1c1d2e-8a4b-4c3d-9e2f-1a2b3c4d5e6f";

describe("checkInSchema", () => {
  it("needs a lookup and a station", () => {
    expect(checkInSchema.safeParse({ query: "SQ-7K2QM", stationId: "3" })).toMatchObject({
      success: true,
      data: { query: "SQ-7K2QM", stationId: 3 },
    });
    expect(checkInSchema.safeParse({ query: "", stationId: "3" }).success).toBe(false);
    expect(checkInSchema.safeParse({ query: "SQ-7K2QM", stationId: "" }).success).toBe(false);
  });
});

describe("checkOutSchema", () => {
  it("accepts one session or a whole station, with an optional amount and method", () => {
    expect(checkOutSchema.safeParse({ sessionId: SESSION_ID, amount: "300", method: "upi" })).toMatchObject({
      success: true,
      data: { target: { sessionId: SESSION_ID }, amountPaise: 30000, method: "upi" },
    });
    expect(checkOutSchema.safeParse({ stationId: "2", amount: "", method: "" })).toMatchObject({
      success: true,
      data: { target: { stationId: 2 }, amountPaise: null, method: null },
    });
  });

  it("rejects a bad amount", () => {
    expect(checkOutSchema.safeParse({ sessionId: SESSION_ID, amount: "abc" }).success).toBe(false);
  });

  it("needs a session or a station", () => {
    expect(checkOutSchema.safeParse({ amount: "100" }).success).toBe(false);
  });
});

describe("voidSchema", () => {
  it("needs a reason", () => {
    expect(voidSchema.safeParse({ sessionId: SESSION_ID, reason: "  " }).success).toBe(false);
    expect(voidSchema.safeParse({ sessionId: SESSION_ID, reason: "Wrong station" }).success).toBe(true);
  });
});

describe("correctionSchema", () => {
  const base = { sessionId: SESSION_ID, startedAt: "2026-11-03T16:00", endedAt: "2026-11-03T18:30", reason: "Forgot to check out" };

  it("reads times as India time", () => {
    const result = correctionSchema.safeParse(base);
    expect(result.success && result.data.startedAt.toISOString()).toBe("2026-11-03T10:30:00.000Z");
  });

  it("needs the end after the start", () => {
    expect(correctionSchema.safeParse({ ...base, endedAt: "2026-11-03T15:00" }).success).toBe(false);
  });

  it("refuses sessions longer than 24 hours", () => {
    expect(correctionSchema.safeParse({ ...base, endedAt: "2026-11-04T16:01" }).success).toBe(false);
  });

  it("needs a reason", () => {
    expect(correctionSchema.safeParse({ ...base, reason: "" }).success).toBe(false);
  });
});
