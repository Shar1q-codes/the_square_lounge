"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Vector3 } from "three";
import { clampDelta } from "./palette";

const HALF_FOV_TAN = Math.tan(MathUtils.degToRad(20)); // camera fov is 40°
const SCENE_HALF_WIDTH = 4.6; // orbit radius plus half a screen

/**
 * Eases the camera towards a target built from three inputs:
 * - fit: pulls back on narrow (portrait) viewports so the orbit stays in frame
 * - mouse: a gentle parallax tilt (mouse only, so touch scrolling never jolts it)
 * - scroll: `progress` (0 → 1 through the hero) dollies the camera back and up
 */
export function CameraRig({ progress }: { progress: RefObject<number> }) {
  const pointer = useRef({ x: 0, y: 0 });
  const lookAt = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera, size }, delta) => {
    const dt = clampDelta(delta);
    const aspect = size.width / size.height;
    const fit = MathUtils.clamp(SCENE_HALF_WIDTH / (HALF_FOV_TAN * aspect), 9, 15);
    const p = progress.current ?? 0;

    const tx = pointer.current.x * 0.7;
    const ty = 0.3 + pointer.current.y * 0.4 + p * 1.8;
    const tz = fit + p * 5;

    camera.position.x = MathUtils.damp(camera.position.x, tx, 2.5, dt);
    camera.position.y = MathUtils.damp(camera.position.y, ty, 2.5, dt);
    camera.position.z = MathUtils.damp(camera.position.z, tz, 2, dt);
    lookAt.set(0, -p * 0.6, 0);
    camera.lookAt(lookAt);
  });

  return null;
}
