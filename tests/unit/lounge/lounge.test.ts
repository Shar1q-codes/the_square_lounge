import { describe, expect, it } from "vitest";
import { FACING, PILLARS, ROOM, STATIONS, VIEWPOINTS } from "@/config/lounge";
import { site } from "@/config/site";
import { angleBetween, clampToRoom, easeInOut, lookAngles, stationCard, toLandscape, walk } from "@/lib/lounge";
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

  it("pushes the camera out of a pillar", () => {
    const [px, pz] = PILLARS[0];
    const [x, , z] = clampToRoom([px + 0.1, 1.6, pz + 0.02]);
    expect(Math.max(Math.abs(x - px), Math.abs(z - pz))).toBeGreaterThan(0.5);
  });
});

describe("walking", () => {
  it("looks along -z at yaw 0 and turns left as yaw grows", () => {
    expect(lookAngles([5, 1.6, 5], [5, 1.6, 1]).yaw).toBeCloseTo(0);
    expect(lookAngles([5, 1.6, 5], [1, 1.6, 5]).yaw).toBeCloseTo(Math.PI / 2);
    expect(lookAngles([5, 1.6, 5], [5, 3, 1]).pitch).toBeGreaterThan(0);
  });

  it("walks the way the camera faces, at the same height", () => {
    const yaw = lookAngles([5, 1.6, 4], [9, 1.6, 4]).yaw;
    const [x, y, z] = walk([5, 1.6, 4], yaw, 1, 0);
    expect(x).toBeCloseTo(6);
    expect(y).toBe(1.6);
    expect(z).toBeCloseTo(4);
  });

  it("slides along a wall instead of going through it", () => {
    // Facing the left wall at an angle: the camera stops at the wall but keeps moving along it.
    const yaw = lookAngles([5, 1.6, 1], [6, 1.6, 0]).yaw;
    let pos = walk([5, 1.6, 1], yaw, 3, 0);
    pos = walk(pos, yaw, 1, 0);
    expect(pos[2]).toBeGreaterThan(0);
    expect(pos[0]).toBeGreaterThan(6.5);
  });

  it("turns the short way round", () => {
    expect(angleBetween(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleBetween(0, 1)).toBeCloseTo(1);
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
