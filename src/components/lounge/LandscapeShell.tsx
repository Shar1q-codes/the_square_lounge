"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { toLandscape } from "@/lib/lounge";
import { cn } from "@/lib/utils";

const REMAPPED = ["pointerdown", "pointermove", "pointerup", "pointercancel", "click"] as const;

/**
 * Shows its children sideways, full-screen, while `rotated` (a phone held upright). Touches on the
 * 3D canvas are re-sent with coordinates in the rotated view's own frame, so the camera controls
 * follow what the viewer sees; LoungeCanvas reads those coordinates directly for picking.
 */
export function LandscapeShell({ rotated, className, children }: { rotated: boolean; className?: string; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outer.current;
    if (!rotated || !el) return;
    const remap = (e: Event) => {
      if (!e.isTrusted || !(e.target instanceof HTMLCanvasElement)) return;
      e.stopPropagation();
      const src = e as PointerEvent;
      const { x, y } = toLandscape(src.clientX, src.clientY, el.getBoundingClientRect());
      const init = {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX: x,
        clientY: y,
        button: src.button,
        buttons: src.buttons,
        ctrlKey: src.ctrlKey,
        shiftKey: src.shiftKey,
        altKey: src.altKey,
        metaKey: src.metaKey,
      };
      const copy =
        e.type === "click"
          ? new MouseEvent("click", init)
          : new PointerEvent(e.type, {
              ...init,
              pointerId: src.pointerId,
              pointerType: src.pointerType,
              isPrimary: src.isPrimary,
              width: src.width,
              height: src.height,
              pressure: src.pressure,
            });
      e.target.dispatchEvent(copy);
    };
    for (const type of REMAPPED) el.addEventListener(type, remap, { capture: true });
    return () => {
      for (const type of REMAPPED) el.removeEventListener(type, remap, { capture: true });
    };
  }, [rotated]);

  return (
    <div
      ref={outer}
      data-rotated={rotated || undefined}
      // Wheel and touch belong to the 3D controls, not the page's smooth scrolling.
      data-lenis-prevent
      className={rotated ? "fixed inset-0 z-[60] overflow-hidden bg-[#0b0e10]" : cn("relative overflow-hidden", className)}
    >
      <div
        className={rotated ? "absolute left-full top-0 h-[100vw] w-[100dvh] origin-top-left rotate-90" : "absolute inset-0"}
      >
        {children}
      </div>
    </div>
  );
}
