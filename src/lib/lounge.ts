import { site } from "@/config/site";
import { PILLARS, ROOM, type Station, type Vec3 } from "@/config/lounge";

type Box = { top: number; right: number };

/**
 * The phone shell turns the view a quarter turn clockwise, so its top runs along the right edge of
 * the screen. Maps a point on the screen to the rotated view's own coordinates, so a drag the viewer sees as
 * "left to right" moves the camera left to right. `box` is the shell's on-screen box.
 */
export function toLandscape(clientX: number, clientY: number, box: Box): { x: number; y: number } {
  return { x: clientY - box.top, y: box.right - clientX };
}

/** How close the camera may come to the walls, floor and ceiling (metres). */
const MARGIN = { wall: 0.35, floor: 0.4, ceiling: 0.3 };

/** Half the width of a pillar plus the wall margin: how close the camera may come to a pillar's centre. */
const PILLAR_REACH = 0.225 + MARGIN.wall;

/**
 * Keeps a camera position inside the room and out of the pillars. Each axis is held on its own, so
 * walking into a wall or pillar slides along it instead of stopping dead.
 */
export function clampToRoom([x, y, z]: Vec3): Vec3 {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  let cx = clamp(x, MARGIN.wall, ROOM.length - MARGIN.wall);
  let cz = clamp(z, MARGIN.wall, ROOM.width - MARGIN.wall);
  for (const [px, pz] of PILLARS) {
    const dx = cx - px;
    const dz = cz - pz;
    if (Math.abs(dx) >= PILLAR_REACH || Math.abs(dz) >= PILLAR_REACH) continue;
    // Inside: push out through the nearest face.
    if (PILLAR_REACH - Math.abs(dx) < PILLAR_REACH - Math.abs(dz)) cx = px + Math.sign(dx || 1) * PILLAR_REACH;
    else cz = pz + Math.sign(dz || 1) * PILLAR_REACH;
  }
  return [cx, clamp(y, MARGIN.floor, ROOM.height - MARGIN.ceiling), cz];
}

/** How far the view may tilt up or down (radians). */
export const MAX_PITCH = 1.25;

/**
 * Turn (yaw, around y) and tilt (pitch) that look from one point at another. Yaw 0 looks along -z,
 * and grows turning left, as three.js cameras do with rotation order "YXZ".
 */
export function lookAngles(from: Vec3, to: Vec3): { yaw: number; pitch: number } {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch)) };
}

/** A step along the floor: `forward` metres the way the camera faces, `right` metres to its right. */
export function walk([x, y, z]: Vec3, yaw: number, forward: number, right: number): Vec3 {
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  return clampToRoom([x - sin * forward + cos * right, y, z - cos * forward - sin * right]);
}

/** The shortest way round from one angle to another, so a glide never spins the long way. */
export function angleBetween(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Easing for camera moves between viewpoints (smooth start and stop). */
export function easeInOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
}

/** What the TV card says about a station: name, console, screen and players where the site lists them. */
export function stationCard(station: Station) {
  const listed = site.stations.find((s) => s.id === station.id);
  return {
    name: station.label,
    console: station.console,
    screen: `${station.inches}" TV`,
    players: listed ? `Up to ${listed.maxPlayers} players` : null,
    bookHref: listed ? `/?station=${station.id}#booking` : "/#booking",
    bookLabel: listed ? "Book this station" : "Book a station",
  };
}
