import { describe, expect, it } from "vitest";
import { FACING, ROOM, STATIONS, VIEWPOINTS } from "@/config/lounge";
import { site } from "@/config/site";
import { clampToRoom, easeInOut, stationCard, toLandscape } from "@/lib/lounge";
import { navHref } from "@/lib/utils";

describe("toLandscape", () => {
  // A 400×800 phone held upright: the view is turned a quarter clockwise, its top along the right edge.
  const box = { top: 0, right: 400 };

  it("maps the screen's top-right corner to the view's top-left", () => {
    expect(toLandscape(400, 0, box)).toEqual({ x: 0, y: 0 });
  });

  it("maps the bottom-left corner to the view's bottom-right", () => {
    expect(toLandscape(0, 800, box)).toEqual({ x: 800, y: 400 });
  });

  it("turns a swipe down the screen into a left-to-right drag in the view", () => {
    const a = toLandscape(200, 100, box);
    const b = toLandscape(200, 600, box);
    expect(b.x - a.x).toBe(500);
    expect(b.y).toBe(a.y);
  });

  it("accounts for where the shell sits on screen", () => {
    expect(toLandscape(350, 120, { top: 20, right: 380 })).toEqual({ x: 100, y: 30 });
  });
});

describe("clampToRoom", () => {
  it("leaves a point inside the room alone", () => {
    expect(clampToRoom([7, 1.6, 4])).toEqual([7, 1.6, 4]);
  });

  it("pulls a zoomed-out camera back inside the walls, floor and ceiling", () => {
    const [x, y, z] = clampToRoom([-5, 9, 20]);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeLessThan(ROOM.height);
    expect(z).toBeLessThan(ROOM.width);
    expect(clampToRoom([30, -2, -3])[1]).toBeGreaterThan(0);
  });
});

describe("easeInOut", () => {
  it("starts at 0, ends at 1 and passes the middle at 0.5", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(2)).toBe(1);
  });
});

describe("layout", () => {
  it("has the 5 stations of the site, with matching consoles", () => {
    expect(STATIONS).toHaveLength(site.stations.length);
    for (const s of STATIONS) {
      expect(site.stations.find((l) => l.id === s.id)?.console).toBe(s.console);
    }
  });

  it("puts one screen on the entrance wall and two on each long wall", () => {
    const count = (f: number) => STATIONS.filter((s) => s.facing === f).length;
    expect([count(FACING.front), count(FACING.left), count(FACING.right)]).toEqual([1, 2, 2]);
  });

  it("keeps every viewpoint inside the room", () => {
    for (const v of VIEWPOINTS) expect(clampToRoom(v.position)).toEqual(v.position);
  });
});

describe("stationCard", () => {
  it("links to the booking form with the station picked", () => {
    const card = stationCard(STATIONS[0]);
    expect(card.bookHref).toBe(`/?station=${STATIONS[0].id}#booking`);
    expect(card.players).toMatch(/^Up to \d+ players$/);
  });
});

describe("navHref", () => {
  it("sends section links back to the homepage from other pages", () => {
    expect(navHref("#pricing", true)).toBe("#pricing");
    expect(navHref("#pricing", false)).toBe("/#pricing");
    expect(navHref("/lounge", false)).toBe("/lounge");
  });
});
