import { describe, expect, it } from "vitest";
import {
  canVoid,
  formatDuration,
  istInputValue,
  minutesBetween,
  needsAttention,
  parseIstInput,
  parseRupees,
} from "@/lib/sessions";

const at = (iso: string) => new Date(iso);

describe("minutesBetween", () => {
  it("counts whole minutes, rounding down", () => {
    expect(minutesBetween(at("2026-11-03T10:00:00Z"), at("2026-11-03T11:29:59Z"))).toBe(89);
  });

  it("is 0 for under a minute", () => {
    expect(minutesBetween(at("2026-11-03T10:00:00Z"), at("2026-11-03T10:00:59Z"))).toBe(0);
  });

  it("is never negative", () => {
    expect(minutesBetween(at("2026-11-03T11:00:00Z"), at("2026-11-03T10:00:00Z"))).toBe(0);
  });
});

describe("parseRupees", () => {
  it.each([
    ["150", 15000],
    ["150.50", 15050],
    ["150.5", 15050],
    [" 99 ", 9900],
    ["0", 0],
  ])("reads %s as %i paise", (input, paise) => {
    expect(parseRupees(input)).toEqual({ ok: true, paise });
  });

  it("treats an empty amount as not recorded", () => {
    expect(parseRupees("")).toEqual({ ok: true, paise: null });
  });

  it.each(["-5", "abc", "1.234", "₹150", "10000000"])("rejects %s", (input) => {
    expect(parseRupees(input).ok).toBe(false);
  });
});

describe("canVoid", () => {
  const start = at("2026-11-03T10:00:00Z");

  it("allows voiding up to and including 15 minutes", () => {
    expect(canVoid(start, at("2026-11-03T10:15:00Z"))).toBe(true);
  });

  it("refuses after 15 minutes", () => {
    expect(canVoid(start, at("2026-11-03T10:15:01Z"))).toBe(false);
  });
});

describe("needsAttention", () => {
  it("flags sessions open longer than 12 hours", () => {
    expect(needsAttention(at("2026-11-03T00:00:00Z"), at("2026-11-03T12:00:00Z"))).toBe(false);
    expect(needsAttention(at("2026-11-03T00:00:00Z"), at("2026-11-03T12:00:01Z"))).toBe(true);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0 min"],
    [45, "45 min"],
    [60, "1 h"],
    [125, "2 h 5 min"],
  ])("shows %i minutes as %s", (minutes, text) => {
    expect(formatDuration(minutes)).toBe(text);
  });
});

describe("IST date-time inputs", () => {
  it("reads a datetime-local value as India time", () => {
    expect(parseIstInput("2026-11-03T16:10")?.toISOString()).toBe("2026-11-03T10:40:00.000Z");
  });

  it("rejects malformed values", () => {
    expect(parseIstInput("03/11/2026 4:10 pm")).toBeNull();
  });

  it("writes a date back as an India-time datetime-local value", () => {
    expect(istInputValue(at("2026-11-03T10:40:00Z"))).toBe("2026-11-03T16:10");
  });
});
