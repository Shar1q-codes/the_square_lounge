"use client";

import { Suspense, useRef, useState, type RefObject } from "react";
import { Canvas, events as pointerEvents, type RootState } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { WebGPURenderer } from "three/webgpu";
import { VIEWPOINTS, type Station } from "@/config/lounge";
import { Cafe } from "./Cafe";
import { CeilingLights } from "./CeilingLights";
import { Details } from "./Details";
import { Effects } from "./Effects";
import { Fans } from "./Fans";
import { Room } from "./Room";
import { Seating } from "./Seating";
import { Stations, type Screens } from "./Stations";
import { WalkControls, type MoveInput } from "./WalkControls";

type Props = {
  mobile: boolean;
  /** Viewpoint id the camera is at or moving to. */
  view: string;
  /** False with prefers-reduced-motion: fans and colour cycles hold still, camera moves jump. */
  motion: boolean;
  /** True inside the rotated phone shell: pointer events arrive already in the canvas's own frame. */
  rotated: boolean;
  /** What each booked station's TV shows. */
  screens: Screens;
  /** The on-screen walk arrows. */
  input: RefObject<MoveInput>;
  onInteract: () => void;
  onSelectStation: (station: Station) => void;
};

/**
 * Pointer position for picking. Normally the event's offsetX/Y; in the rotated shell,
 * LandscapeShell re-sends events with clientX/Y already inside the (unrotated) canvas.
 */
function computePointer(event: MouseEvent, state: RootState, rotated: boolean) {
  const x = rotated ? event.clientX : event.offsetX;
  const y = rotated ? event.clientY : event.offsetY;
  state.pointer.set((x / state.size.width) * 2 - 1, -(y / state.size.height) * 2 + 1);
  state.raycaster.setFromCamera(state.pointer, state.camera);
}

/**
 * The 3D lounge. Loaded with next/dynamic (ssr: false) from LoungeViewer, only on /lounge.
 * Quality steps down on slow devices: floor reflections go first, then bloom. Phones start without reflections.
 */
export default function LoungeCanvas({ mobile, motion, view, rotated, screens, input, onInteract, onSelectStation }: Props) {
  const start = VIEWPOINTS.find((v) => v.id === view) ?? VIEWPOINTS[0];
  // The event manager is created once, so it reads the current rotation through a ref.
  const rotatedRef = useRef(rotated);
  rotatedRef.current = rotated;
  const [quality, setQuality] = useState<0 | 1 | 2>(mobile ? 1 : 2);

  return (
    <Canvas
      // offsetSize: measure the canvas box before CSS rotation (the phone shell turns it sideways).
      resize={{ offsetSize: true }}
      events={(store) => ({ ...pointerEvents(store), compute: (e, state) => computePointer(e, state, rotatedRef.current) })}
      dpr={[1, mobile ? 1.25 : 1.75]}
      camera={{ position: start.position, fov: mobile ? 62 : 55, near: 0.05, far: 60 }}
      // three.js's WebGPU renderer; on devices without WebGPU it runs on WebGL 2 by itself.
      gl={async ({ canvas }) => {
        const renderer = new WebGPURenderer({ canvas: canvas as HTMLCanvasElement, antialias: !mobile, powerPreference: "high-performance" });
        await renderer.init();
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        return renderer;
      }}
    >
      <PerformanceMonitor flipflops={3} onDecline={() => setQuality((q) => (q > 0 ? ((q - 1) as 0 | 1) : 0))} />
      <color attach="background" args={["#0b0e10"]} />
      <Suspense fallback={null}>
        <Room reflections={quality === 2} />
        <CeilingLights motion={motion} />
        <Fans motion={motion} />
        <Stations screens={screens} maxTrailers={mobile ? 1 : 3} onSelect={onSelectStation} />
        <Seating />
        <Cafe />
        <Details />
      </Suspense>
      <WalkControls view={view} motion={motion} input={input} onInteract={onInteract} />
      {quality > 0 && <Effects />}
    </Canvas>
  );
}

