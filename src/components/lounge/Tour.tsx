"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, type EventDispatcher } from "three";
import { VIEWPOINTS } from "@/config/lounge";
import { clampToRoom, easeInOut } from "@/lib/lounge";

const MOVE_SECONDS = 2.4;

/** The parts of drei's OrbitControls (registered with makeDefault) that the tour uses. */
type Controls = EventDispatcher<{ start: object }> & { target: Vector3; update: () => void };

type Props = {
  /** Viewpoint to move to. */
  view: string;
  /** False with reduced motion: jump straight there. */
  motion: boolean;
  /** Called when the visitor drags, swipes or zooms (ends the guided tour). */
  onInteract: () => void;
};

/** Glides the camera and the orbit target to the chosen viewpoint, and keeps the camera inside the room. */
export function Tour({ view, motion, onInteract }: Props) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as Controls | null;
  const move = useRef<{ fromPos: Vector3; fromTarget: Vector3; toPos: Vector3; toTarget: Vector3; t: number } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!controls) return;
    const point = VIEWPOINTS.find((v) => v.id === view) ?? VIEWPOINTS[0];
    const toPos = new Vector3(...point.position);
    const toTarget = new Vector3(...point.target);
    if (!motion || first.current) {
      first.current = false;
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.update();
      move.current = null;
      return;
    }
    move.current = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos, toTarget, t: 0 };
  }, [view, motion, camera, controls]);

  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      move.current = null;
      onInteract();
    };
    controls.addEventListener("start", onStart);
    return () => controls.removeEventListener("start", onStart);
  }, [controls, onInteract]);

  // Runs after OrbitControls' own update (priority -1), so the clamp holds before each render.
  useFrame((_, delta) => {
    camera.position.set(...clampToRoom([camera.position.x, camera.position.y, camera.position.z]));
    const m = move.current;
    if (!m || !controls) return;
    m.t = Math.min(1, m.t + delta / MOVE_SECONDS);
    const k = easeInOut(m.t);
    camera.position.lerpVectors(m.fromPos, m.toPos, k);
    controls.target.lerpVectors(m.fromTarget, m.toTarget, k);
    controls.update();
    if (m.t === 1) move.current = null;
  });

  return null;
}
