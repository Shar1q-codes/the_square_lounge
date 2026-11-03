/**
 * Layout of the real hall, estimated from the owner's four corner photos (see SPEC-lounge-3d.md).
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

/** Square columns: [x, z], 0.45 m wide. Both stand right of centre (as you walk in). */
export const PILLARS: Vec2[] = [
  [5.0, 6.0],
  [11.8, 6.2],
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

/**
 * The 5 screens (ids match site.stations), each on a white marble stand: one on the entrance wall
 * beside the doorway, two on the left wall, two on the right.
 */
export const STATIONS: Station[] = [
  { id: 1, label: "Station 01", console: "PS5", position: [0, 1.5, 4.4], facing: FACING.front, inches: 55 },
  { id: 2, label: "Station 02", console: "PS5", position: [5.0, 1.5, 0], facing: FACING.left, inches: 65 },
  { id: 3, label: "Station 03", console: "PS5", position: [10.0, 1.5, 0], facing: FACING.left, inches: 55 },
  { id: 4, label: "Station 04", console: "PS4", position: [3.4, 1.5, ROOM.width], facing: FACING.right, inches: 50 },
  { id: 5, label: "Station 05", console: "PS4", position: [7.8, 1.5, ROOM.width], facing: FACING.right, inches: 50 },
];

/** Sofas: centre [x, z] and rotation (0 faces the right wall's screens, PI the left wall's). */
export const SOFAS: { position: Vec2; rotation: number; seats: 2 | 3 }[] = [
  // Back-to-back pair between stations 02 and 05
  { position: [6.2, 3.7], rotation: Math.PI, seats: 3 },
  { position: [6.2, 4.65], rotation: 0, seats: 2 },
  // Single sofa facing station 03
  { position: [9.6, 3.4], rotation: Math.PI, seats: 2 },
];

export const BEAN_BAGS: { position: Vec2; color: string }[] = [
  { position: [1.8, 3.4], color: "#5b1a27" },
  { position: [4.4, 2.0], color: "#7a1824" },
  { position: [7.6, 2.3], color: "#4a1c33" },
  { position: [11.2, 2.0], color: "#5b1a27" },
  { position: [3.6, 6.9], color: "#8c1f2a" },
  { position: [7.0, 6.8], color: "#5b1a27" },
  { position: [12.6, 7.4], color: "#2a3a9c" },
  { position: [13.6, 7.9], color: "#2a3a9c" },
];

/** Dark wood tables: two in front of the curtains, and the laptop desk by the second pillar. */
export const CAFE_TABLES: { position: Vec2; laptop: boolean }[] = [
  { position: [10.9, 5.1], laptop: true },
  { position: [13.7, 3.0], laptop: false },
  { position: [13.7, 5.0], laptop: false },
];

export type Viewpoint = { id: string; label: string; position: Vec3; target: Vec3 };

/** Camera spots matching the owner's four corner photos, plus a view of the PS5 wall. */
export const VIEWPOINTS: Viewpoint[] = [
  { id: "overview", label: "Overview", position: [0.6, 2.4, 0.6], target: [13.5, 0.8, 7.2] },
  { id: "entrance", label: "Entrance", position: [0.7, 1.7, 5.2], target: [15, 1.2, 4.0] },
  { id: "ps5-wall", label: "PS5 wall", position: [5.8, 1.6, 7.9], target: [5.8, 1.2, 0] },
  { id: "sofas", label: "Sofas", position: [10.5, 1.7, 8.2], target: [0, 0.9, 1.8] },
  { id: "cafe", label: "Café corner", position: [14.3, 1.8, 0.7], target: [0, 1.0, 7.0] },
];

/** Wall-mounted and standing details. Wall items: [along-the-wall position, height] on a named wall. */
export type WallName = keyof typeof FACING;
export type PosterSpot = { wall: WallName; along: number; y: number; style: number; size: [number, number] };

export const POSTERS: PosterSpot[] = [
  // Left wall, in the order the photos show: game art round station 02, football art round 03
  { wall: "left", along: 4.0, y: 2.3, style: 0, size: [0.6, 0.85] },
  { wall: "left", along: 6.0, y: 2.3, style: 1, size: [0.6, 0.85] },
  { wall: "left", along: 9.1, y: 2.3, style: 4, size: [0.6, 0.85] },
  { wall: "left", along: 10.9, y: 2.3, style: 3, size: [0.6, 0.85] },
  { wall: "left", along: 13.2, y: 2.3, style: 1, size: [0.6, 0.85] },
  // Right wall: tall dark posters toward the curtains
  { wall: "right", along: 9.8, y: 2.1, style: 2, size: [0.7, 1.05] },
  { wall: "right", along: 11.6, y: 2.1, style: 0, size: [0.7, 1.05] },
  { wall: "right", along: 13.4, y: 2.1, style: 3, size: [0.7, 1.05] },
  // Entrance wall: the small food-menu poster
  { wall: "front", along: 1.8, y: 1.95, style: 4, size: [0.45, 0.6] },
];

/** Maroon curtains over the windows on the far wall: [from, to] along the wall (z). */
export const CURTAINS: Vec2[] = [
  [1.9, 4.5],
  [5.3, 8.7],
];

export const AC_UNITS: { wall: WallName; along: number }[] = [{ wall: "front", along: 3.0 }];

export const CCTV: Vec3[] = [
  [0.45, 3.2, 0.45],
  [14.5, 3.2, 8.5],
  [14.5, 3.2, 0.5],
  [0.45, 3.2, 8.5],
];

/** Doorway to the stairs on the entrance wall (x = 0), centred at this z. */
export const ENTRANCE_Z = 6.5;
/** Wooden door on the far wall (x = length) in the left corner, centred at this z. */
export const BACK_DOOR_Z = 0.85;
/** The standing "EAT. PLAY. DOMINATE." banner, just inside the entrance, turned to the room. */
export const BANNER = { position: [0.6, 7.75] as Vec2, rotation: 2.0 };
/** Teal dustbin beside the banner. */
export const BIN: Vec2 = [0.45, 8.5];
