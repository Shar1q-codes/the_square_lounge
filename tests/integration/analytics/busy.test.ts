import { beforeEach, describe, expect, it } from "vitest";
import { heatmap, stationUse } from "@/server/analytics/busy";
import { resetDb } from "../../support/db";
import { RANGE, seedAnalytics } from "../../support/analyticsFixture";

beforeEach(async () => {
  await resetDb();
  await seedAnalytics();
});

const THU = 4;
const SAT = 6;
const SUN = 0;

describe("heatmap", () => {
  it("averages how many members play in each weekday × hour, by business day", async () => {
    const grid = await heatmap(RANGE);
    const at = (dow: number, hour: number) => grid.find((c) => c.dow === dow && c.hour === hour)?.playing;

    expect(at(THU, 18)).toBe(1); // s1
    expect(at(THU, 19)).toBe(1);
    expect(at(SAT, 23)).toBe(1); // s2 + s3, half an hour each
    expect(at(SAT, 0)).toBe(2); // both for the whole hour, still "Saturday night"
    expect(at(SAT, 1)).toBe(1);
    expect(at(SUN, 2)).toBe(1); // s4 started Monday 02:00 IST
    expect(at(THU, 12)).toBe(0);
  });

  it("covers every opening hour of every weekday, and no closed hours", async () => {
    const grid = await heatmap(RANGE);

    expect(grid).toHaveLength(7 * 17);
    expect(grid.some((c) => c.hour >= 4 && c.hour <= 10)).toBe(false);
  });
});

describe("stationUse", () => {
  it("counts visits, hours, revenue and busy hours per station", async () => {
    const rows = await stationUse(RANGE);

    expect(rows).toEqual([
      { id: 1, name: "Station 01", console: "PS5", visits: 3, minutes: 360, revenuePaise: 70000, busyHours: 5, openHours: 119 },
      { id: 2, name: "Station 02", console: "PS4", visits: 1, minutes: 60, revenuePaise: 0, busyHours: 1, openHours: 119 },
    ]);
  });
});
