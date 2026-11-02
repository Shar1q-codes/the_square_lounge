import { describe, expect, it } from "vitest";
import { businessDate, csvRow, heatLevel, pctChange, resolveRange } from "@/lib/analytics";

// 3 Nov 2026, 15:00 IST
const NOW = new Date("2026-11-03T09:30:00Z");

describe("businessDate boundaries", () => {
  it.each([
    ["2026-11-06T19:59:00Z", "2026-11-06"], // Sat 01:29 IST → Friday's business day
    ["2026-11-06T22:29:00Z", "2026-11-06"], // Sat 03:59 IST → still Friday
    ["2026-11-06T22:30:00Z", "2026-11-07"], // Sat 04:00 IST → Saturday
    ["2026-11-07T05:30:00Z", "2026-11-07"], // Sat 11:00 IST
  ])("%s is business day %s", (iso, day) => {
    expect(businessDate(new Date(iso))).toBe(day);
  });
});

describe("resolveRange", () => {
  it("defaults to the last 7 business days, ending today, with the 7 before as the previous period", () => {
    const r = resolveRange({}, NOW);

    expect(r).toMatchObject({ key: "7d", fromDate: "2026-10-28", toDate: "2026-11-03", days: 7 });
    expect(r.from.toISOString()).toBe("2026-10-27T22:30:00.000Z"); // 28 Oct 04:00 IST
    expect(r.to.toISOString()).toBe("2026-11-03T22:30:00.000Z"); // 4 Nov 04:00 IST
    expect(r.previousFrom.toISOString()).toBe("2026-10-20T22:30:00.000Z");
    expect(r.previousTo.toISOString()).toBe(r.from.toISOString());
  });

  it("supports 30 and 90 days", () => {
    expect(resolveRange({ range: "30d" }, NOW)).toMatchObject({ fromDate: "2026-10-05", days: 30 });
    expect(resolveRange({ range: "90d" }, NOW)).toMatchObject({ fromDate: "2026-08-06", days: 90 });
  });

  it("accepts a custom range of business dates", () => {
    expect(resolveRange({ range: "custom", from: "2026-10-01", to: "2026-10-31" }, NOW)).toMatchObject({
      key: "custom",
      fromDate: "2026-10-01",
      toDate: "2026-10-31",
      days: 31,
    });
  });

  it.each([
    [{ range: "custom", from: "2026-10-31", to: "2026-10-01" }],
    [{ range: "custom", from: "nonsense", to: "2026-10-01" }],
    [{ range: "custom", from: "2026-10-01", to: "2026-12-01" }],
    [{ range: "custom", from: "2024-01-01", to: "2026-10-01" }],
    [{ range: "365d" }],
  ])("falls back to 7 days for %o", (params) => {
    expect(resolveRange(params, NOW).key).toBe("7d");
  });
});

describe("pctChange", () => {
  it.each([
    [150, 100, 50],
    [50, 100, -50],
    [0, 0, 0],
    [10, 0, null],
  ])("%i vs %i is %s%", (current, previous, expected) => {
    expect(pctChange(current, previous)).toBe(expected);
  });
});

describe("csvRow", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvRow(["Malakpet, Hyd", 'say "hi"', "two\nlines", 5, null])).toBe('"Malakpet, Hyd","say ""hi""","two\nlines",5,');
  });

  it("stops spreadsheets from running formulas", () => {
    expect(csvRow(["=HYPERLINK(1)", "+91", "-x", "@me"])).toBe("'=HYPERLINK(1),'+91,'-x,'@me");
  });

  it("leaves numbers alone, including negative ones", () => {
    expect(csvRow([-20, 3.5])).toBe("-20,3.5");
  });
});

describe("heatLevel", () => {
  it.each([
    [0, 10, 0],
    [0.1, 10, 1],
    [5, 10, 2],
    [10, 10, 4],
    [3, 0, 0],
  ])("%s of max %s is level %i", (value, max, level) => {
    expect(heatLevel(value, max)).toBe(level);
  });
});
