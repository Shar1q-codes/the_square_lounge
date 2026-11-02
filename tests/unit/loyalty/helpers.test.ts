import { describe, expect, it } from "vitest";
import { normaliseVoucherCode, pointsFor } from "@/lib/loyalty";

describe("pointsFor", () => {
  it.each([
    [0, 0],
    [5, 0],
    [6, 1],
    [59, 9],
    [60, 10],
    [95, 15],
    [720, 120],
    [900, 120],
  ])("%i minutes on PS5 earn %i points", (minutes, points) => {
    expect(pointsFor(minutes, "PS5")).toBe(points);
  });

  it("uses the PS4 rate too", () => {
    expect(pointsFor(60, "PS4")).toBe(10);
  });

  it("never goes negative", () => {
    expect(pointsFor(-30, "PS5")).toBe(0);
  });
});

describe("normaliseVoucherCode", () => {
  it.each(["V-7K2QM4", "v-7k2qm4", " v 7K2 QM4 ", "7k2qm4"])("reads %s as V-7K2QM4", (input) => {
    expect(normaliseVoucherCode(input)).toBe("V-7K2QM4");
  });

  it.each(["V-7K2QM", "SQ-7K2QM", "V-0K2QM4", ""])("rejects %s", (input) => {
    expect(normaliseVoucherCode(input)).toBeNull();
  });
});
