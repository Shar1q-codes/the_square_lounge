import { Color } from "three";

/** Brand colours for the 3D scene (mirrors the Tailwind tokens in globals.css). */
export const BG = "#07070a";
export const GOLD = "#d4b26a";
export const GOLD_SOFT = "#e6cf9a";
export const BLUE = "#3b82f6";

/**
 * A colour pushed above 1.0 so it crosses the bloom threshold.
 * Use only on materials with `toneMapped={false}`.
 */
export function glow(hex: string, strength: number): Color {
  return new Color(hex).multiplyScalar(strength);
}

/** Frame deltas can spike after a tab switch or a paused frameloop; clamp them for motion. */
export const clampDelta = (delta: number) => Math.min(delta, 0.1);
