/**
 * Layout of the real hall, estimated from the owner's photos (public/images/gallery/lounge-*.jpg).
 * Units are metres. x runs along the hall (0 = entrance end), z across it (0 = left wall when you
 * walk in), y is up. Correct the numbers here if the room is measured: the 3D model reads only this.
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export const ROOM = {
  length: 15, // x
  width: 9, // z
  height: 3.2, // floor to lower ceiling
  /** The raised centre of the false ceiling. */
  tray: { x: [2.6, 12.4] as Vec2, z: [1.4, 7.6] as Vec2, rise: 0.28 },
  /** The smaller grid panel in the middle of the tray. */
  panel: { x: [5.6, 9.4] as Vec2, z: [3.2, 5.8] as Vec2, rise: 0.22 },
} as const;

export const COLORS = {
  wall: "#8fd8e2", // light aqua paint
  floor: "#eceeed", // glossy white tiles
  grout: "#cfd5d4",
  ceiling: "#f4f6f8",
  pillar: "#86d0db",
  ledCyan: "#5fe9ff",
  sofa: "#5f6e63", // grey-green fabric
  sofaDark: "#4c5a50",
  marble: "#f1f1f1",
  wood: "#3b2a22",
  chair: "#2a2522",
  curtain: "#4a1420",
  tvBezel: "#0b0c0e",
} as const;

/** The centre cove cycles through the colours seen in the photos. */
export const COVE_CYCLE = ["#2f55ff", "#8a3cff", "#20e3c2", "#ff3fbf", "#2f8bff"] as const;
/** The outer perimeter cove (warm gold in one photo, green or magenta in others). */
export const PERIMETER_CYCLE = ["#ff9a3c", "#3cff6a", "#ff3fd0", "#ffb347"] as const;

/** Square columns: [x, z], 0.45 m wide. */
export const PILLARS: Vec2[] = [
  [5.2, 3.3],
  [9.6, 5.9],
  [11.4, 2.2],
];

export type Station = {
  /** Matches site.stations ids where one exists. */
  id: number;
  label: string;
  console: "PS5" | "PS4";
  /** Point on the wall the TV hangs on, and which way it faces (radians around y). */
  position: Vec3;
  facing: number;
  /** Screen diagonal in inches. */
  inches: 50 | 55 | 65;
};

/** Rotation (around y) that turns a screen, which faces +z by default, to face into the room from each wall. */
export const FACING = {
  left: 0, // on the z = 0 wall, facing +z
  right: Math.PI, // on the z = width wall, facing -z
  front: Math.PI / 2, // on the entrance wall (x = 0), facing +x
  back: -Math.PI / 2, // on the far end wall (x = length), facing -x
} as const;

/** About 8 screens are visible in the photos; ids 1–5 match the site's stations. */
export const STATIONS: Station[] = [
  { id: 1, label: "Station 01", console: "PS5", position: [3.2, 1.55, 0], facing: FACING.left, inches: 65 },
  { id: 2, label: "Station 02", console: "PS5", position: [7.6, 1.55, 0], facing: FACING.left, inches: 55 },
  { id: 3, label: "Station 03", console: "PS5", position: [12.2, 1.55, 0], facing: FACING.left, inches: 55 },
  { id: 4, label: "Station 04", console: "PS4", position: [4.4, 1.55, ROOM.width], facing: FACING.right, inches: 50 },
  { id: 5, label: "Station 05", console: "PS4", position: [8.6, 1.55, ROOM.width], facing: FACING.right, inches: 55 },
  { id: 6, label: "Station 06", console: "PS5", position: [12.6, 1.55, ROOM.width], facing: FACING.right, inches: 65 },
  { id: 7, label: "Station 07", console: "PS5", position: [0, 1.55, 6.4], facing: FACING.front, inches: 55 },
  { id: 8, label: "Station 08", console: "PS4", position: [ROOM.length, 1.55, 1.6], facing: FACING.back, inches: 50 },
];


/** Back-to-back sofa pairs in the middle: centre [x, z] and rotation (radians). */
export const SOFAS: { position: Vec2; rotation: number; seats: 2 | 3 }[] = [
  { position: [4.0, 2.4], rotation: 0, seats: 3 },
  { position: [4.0, 3.35], rotation: Math.PI, seats: 3 },
  { position: [7.4, 6.6], rotation: Math.PI, seats: 3 },
  { position: [7.4, 5.65], rotation: 0, seats: 2 },
  { position: [11.9, 6.5], rotation: Math.PI, seats: 2 },
];

export const BEAN_BAGS: { position: Vec2; color: string }[] = [
  { position: [2.2, 1.6], color: "#5b1a27" },
  { position: [6.0, 1.3], color: "#7a1824" },
  { position: [9.2, 1.4], color: "#4a1c33" },
  { position: [2.9, 7.6], color: "#8c1f2a" },
  { position: [6.2, 7.8], color: "#5b1a27" },
  { position: [10.4, 7.9], color: "#2a3a9c" },
  { position: [13.0, 3.6], color: "#2a3a9c" },
  { position: [9.0, 3.6], color: "#4a1c33" },
];

/** Café corner by the curtained windows: table centres [x, z]. */
export const CAFE_TABLES: Vec2[] = [
  [13.6, 4.4],
  [13.6, 6.1],
];

export type Viewpoint = { id: string; label: string; position: Vec3; target: Vec3 };

/** Camera spots, chosen to match the angles of the owner's photos (all inside the room). */
export const VIEWPOINTS: Viewpoint[] = [
  { id: "overview", label: "Overview", position: [0.7, 2.25, 8.3], target: [9.5, 1.1, 2.6] },
  { id: "entrance", label: "Entrance", position: [0.6, 1.6, 1.0], target: [9, 1.3, 5.5] },
  { id: "ps5-wall", label: "PS5 wall", position: [7.6, 1.55, 5.4], target: [7.6, 1.35, 0] },
  { id: "sofas", label: "Sofas", position: [1.6, 1.45, 7.2], target: [7.4, 0.7, 4.0] },
  { id: "cafe", label: "Café corner", position: [10.0, 1.6, 3.4], target: [14.8, 1.2, 5.4] },
];

/** Wall-mounted and standing details. Wall items: [along-the-wall position, height] on a named wall. */
export type WallName = keyof typeof FACING;
export type PosterSpot = { wall: WallName; along: number; y: number; style: number; size: [number, number] };

export const POSTERS: PosterSpot[] = [
  { wall: "left", along: 5.4, y: 2.15, style: 0, size: [0.6, 0.85] },
  { wall: "left", along: 9.9, y: 2.15, style: 1, size: [0.6, 0.85] },
  { wall: "left", along: 14.0, y: 2.15, style: 2, size: [0.6, 0.85] },
  { wall: "right", along: 2.3, y: 2.15, style: 3, size: [0.6, 0.85] },
  { wall: "right", along: 6.5, y: 2.2, style: 4, size: [0.6, 0.85] },
  { wall: "right", along: 7.6, y: 2.2, style: 2, size: [0.6, 0.85] },
  { wall: "right", along: 10.6, y: 2.2, style: 0, size: [0.7, 1.0] },
  { wall: "front", along: 4.2, y: 2.1, style: 1, size: [0.55, 0.8] },
  { wall: "front", along: 8.2, y: 2.1, style: 3, size: [0.55, 0.8] },
];

/** Maroon curtains over the windows on the far wall: [from, to] along the wall (z). */
export const CURTAINS: Vec2[] = [
  [2.8, 5.3],
  [5.7, 8.4],
];

export const AC_UNITS: { wall: WallName; along: number }[] = [
  { wall: "left", along: 10.6 },
  { wall: "right", along: 5.5 },
];

export const CCTV: Vec3[] = [
  [0.45, 3.2, 0.45],
  [14.5, 3.2, 8.5],
  [7.6, 3.2, 8.55],
  [14.5, 3.2, 0.5],
];

/** Glass entrance door on the front wall (to the stairs), centred at this z. */
export const ENTRANCE_Z = 1.35;
/** Wooden door on the right wall near the curtains, centred at this x. */
export const BACK_DOOR_X = 14.35;
/** Reception counter along the left wall by the entrance: [from, to] along x. */
export const COUNTER: Vec2 = [0.5, 2.3];
/** The standing "EAT. PLAY. DOMINATE." banner. */
export const BANNER = { position: [11.2, 8.45] as Vec2, rotation: -Math.PI * 0.76 }; // facing the room centre
/** Teal dustbin. */
export const BIN: Vec2 = [10.1, 6.35];
