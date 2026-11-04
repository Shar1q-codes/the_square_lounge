"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, type PerspectiveCamera } from "three";
import { VIEWPOINTS, type Vec3 } from "@/config/lounge";
import { MAX_PITCH, angleBetween, clampToRoom, easeInOut, lookAngles, walk } from "@/lib/lounge";

const MOVE_SECONDS = 2.4;
/** Walking speed for the arrow buttons and keys (metres per second), and turning speed (radians per second). */
const WALK_SPEED = 2.2;
const TURN_SPEED = 1.6;
/** Eye height the camera settles to while walking (the viewpoints start higher, for a wider view). */
const EYE_HEIGHT = 1.6;
/** Metres moved per pixel of mouse wheel, and per pixel of pinch. */
const WHEEL_STEP = 0.003;
const PINCH_STEP = 0.012;

/** Held-down state of the on-screen arrows: forward 1 / back -1, turn right 1 / left -1, 0 when let go. */
export type MoveInput = { forward: number; turn: number };

type Props = {
  /** Viewpoint to glide to. */
  view: string;
  /** False with reduced motion: jump straight there. */
  motion: boolean;
  /** The on-screen arrows, read every frame. */
  input: RefObject<MoveInput>;
  /** Called when the visitor looks, walks or zooms (ends the guided tour). */
  onInteract: () => void;
};

type Glide = { fromPos: Vec3; toPos: Vec3; fromYaw: number; turn: number; fromPitch: number; toPitch: number; t: number };

/**
 * First-person controls: the camera stands in the room and turns on the spot. Drag to look around a
 * full circle; walk with the wheel, a pinch, the arrow keys or W A S D, or the on-screen arrows.
 * The camera slides along walls and pillars instead of bumping off them.
 */
export function WalkControls({ view, motion, input, onInteract }: Props) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const canvas = useThree((s) => s.gl.domElement);
  const angles = useRef({ yaw: 0, pitch: 0 });
  const glide = useRef<Glide | null>(null);
  const first = useRef(true);
  const keys = useRef(new Set<string>());
  const interact = useRef(onInteract);
  interact.current = onInteract;

  useEffect(() => {
    camera.rotation.order = "YXZ";
  }, [camera]);

  // Glide (or jump) to the chosen viewpoint.
  useEffect(() => {
    const point = VIEWPOINTS.find((v) => v.id === view) ?? VIEWPOINTS[0];
    const to = lookAngles(point.position, point.target);
    if (!motion || first.current) {
      first.current = false;
      camera.position.set(...point.position);
      angles.current = { ...to };
      glide.current = null;
      return;
    }
    const { yaw, pitch } = angles.current;
    glide.current = {
      fromPos: [camera.position.x, camera.position.y, camera.position.z],
      toPos: point.position,
      fromYaw: yaw,
      turn: angleBetween(yaw, to.yaw),
      fromPitch: pitch,
      toPitch: to.pitch,
      t: 0,
    };
  }, [view, motion, camera]);

  useEffect(() => {
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const takeOver = () => {
      glide.current = null;
      interact.current();
    };
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const step = (metres: number) => {
      camera.position.set(...walk([camera.position.x, camera.position.y, camera.position.z], angles.current.yaw, metres, 0));
    };

    const down = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) pinch = spread();
      // Keep a mouse drag going outside the canvas (re-sent events from the phone shell can't be captured).
      if (e.isTrusted) {
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // Not capturable: the drag ends at the canvas edge.
        }
      }
      takeOver();
    };
    const move = (e: PointerEvent) => {
      const last = pointers.get(e.pointerId);
      if (!last) return;
      const now = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, now);
      if (pointers.size >= 2) {
        const next = spread();
        step((next - pinch) * PINCH_STEP);
        pinch = next;
        return;
      }
      // Drag the view like a photo sphere: a drag across the canvas height turns about one field of view.
      const perPixel = MathUtils.degToRad(camera.fov) / canvas.clientHeight;
      const a = angles.current;
      a.yaw += (now.x - last.x) * perPixel;
      a.pitch = MathUtils.clamp(a.pitch + (now.y - last.y) * perPixel, -MAX_PITCH, MAX_PITCH);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 2) pinch = spread();
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      takeOver();
      step(-e.deltaY * WHEEL_STEP);
    };
    const keyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (!["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) return;
      e.preventDefault();
      keys.current.add(key);
      takeOver();
    };
    const keyUp = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", blur);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", blur);
    };
  }, [camera, canvas]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const a = angles.current;
    const g = glide.current;

    if (g) {
      g.t = Math.min(1, g.t + dt / MOVE_SECONDS);
      const k = easeInOut(g.t);
      camera.position.set(
        MathUtils.lerp(g.fromPos[0], g.toPos[0], k),
        MathUtils.lerp(g.fromPos[1], g.toPos[1], k),
        MathUtils.lerp(g.fromPos[2], g.toPos[2], k),
      );
      a.yaw = g.fromYaw + g.turn * k;
      a.pitch = MathUtils.lerp(g.fromPitch, g.toPitch, k);
      if (g.t === 1) glide.current = null;
    } else {
      // Keys and on-screen arrows: forward/back and turning; A and D step sideways.
      const held = keys.current;
      const pad = input.current;
      const forward = (held.has("w") || held.has("arrowup") ? 1 : 0) - (held.has("s") || held.has("arrowdown") ? 1 : 0) + pad.forward;
      const turn = (held.has("arrowleft") ? 1 : 0) - (held.has("arrowright") ? 1 : 0) - pad.turn;
      const side = (held.has("d") ? 1 : 0) - (held.has("a") ? 1 : 0);
      if (pad.forward || pad.turn) {
        glide.current = null;
        interact.current();
      }
      a.yaw += turn * TURN_SPEED * dt;
      if (forward || side) {
        camera.position.set(...walk([camera.position.x, camera.position.y, camera.position.z], a.yaw, forward * WALK_SPEED * dt, side * WALK_SPEED * dt));
        camera.position.y = MathUtils.damp(camera.position.y, EYE_HEIGHT, 1.5, dt);
      }
      camera.position.set(...clampToRoom([camera.position.x, camera.position.y, camera.position.z]));
    }

    camera.rotation.set(a.pitch, a.yaw, 0);
  });

  return null;
}
