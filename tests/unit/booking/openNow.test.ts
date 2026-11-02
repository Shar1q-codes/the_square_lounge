import { describe, expect, it } from "vitest";
import { isOpenAt } from "@/lib/booking";

// Venue hours: every day 11:00 → 04:00 the next morning.
describe("isOpenAt", () => {
  it.each([
    ["2026-11-06", "10:59", false],
    ["2026-11-06", "11:00", true],
    ["2026-11-06", "23:30", true],
    ["2026-11-07", "01:30", true],
    ["2026-11-07", "03:59", true],
    ["2026-11-07", "04:00", false],
    ["2026-11-07", "07:00", false],
  ])("on %s at %s open is %s", (date, time, open) => {
    expect(isOpenAt(date, time)).toBe(open);
  });
});
