import { site } from "@/config/site";
import { ROOM, type Station, type Vec3 } from "@/config/lounge";

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

/** Keeps a camera position inside the room, so zooming or dragging never goes through a wall. */
export function clampToRoom([x, y, z]: Vec3): Vec3 {
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  return [
    clamp(x, MARGIN.wall, ROOM.length - MARGIN.wall),
    clamp(y, MARGIN.floor, ROOM.height - MARGIN.ceiling),
    clamp(z, MARGIN.wall, ROOM.width - MARGIN.wall),
  ];
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
