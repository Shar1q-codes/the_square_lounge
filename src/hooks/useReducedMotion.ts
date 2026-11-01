"use client";

import { useMediaQuery } from "./useMediaQuery";

/** True when the user asked the OS to reduce motion. SSR-safe (false on the server). */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
