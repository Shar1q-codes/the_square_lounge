"use client";

import { useMediaQuery } from "./useMediaQuery";

/** Phones and small tablets: narrow viewport or a touch-first pointer. Used to lighten the 3D scene. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px), (pointer: coarse)");
}
