"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { ACESFilmicToneMapping } from "three";
import { VIEWPOINTS } from "@/config/lounge";
import { Cafe } from "./Cafe";
import { CeilingLights } from "./CeilingLights";
import { Details } from "./Details";
import { Fans } from "./Fans";
import { Room } from "./Room";
import { Seating } from "./Seating";
import { Stations } from "./Stations";

type Props = {
  mobile: boolean;
  /** Viewpoint id to start from (defaults to the overview). */
  initialView?: string;
  /** False with prefers-reduced-motion: fans and colour cycles hold still. */
  motion: boolean;
};


/**
 * The 3D lounge. Loaded with next/dynamic (ssr: false) from LoungeViewer, only on /lounge.
 * Quality steps down on slow devices: floor reflections go first, then bloom.
 */
export default function LoungeCanvas({ mobile, motion, initialView }: Props) {
  const start = VIEWPOINTS.find((v) => v.id === initialView) ?? VIEWPOINTS[0];
  const [quality, setQuality] = useState<0 | 1 | 2>(mobile ? 1 : 2);

  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ position: start.position, fov: mobile ? 62 : 55, near: 0.05, far: 60 }}
      gl={{ antialias: !mobile, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <PerformanceMonitor flipflops={3} onDecline={() => setQuality((q) => (q > 0 ? ((q - 1) as 0 | 1) : 0))} />
      <color attach="background" args={["#0b0e10"]} />
      <Suspense fallback={null}>
        <Room reflections={quality === 2} />
        <CeilingLights motion={motion} />
        <Fans motion={motion} />
        <Stations />
        <Seating />
        <Cafe />
        <Details />
      </Suspense>
      <OrbitControls
        makeDefault
        target={start.target}
        enablePan={false}
        minDistance={0.6}
        maxDistance={13}
        maxPolarAngle={Math.PI * 0.62}
        minPolarAngle={Math.PI * 0.18}
        enableDamping
      />
      {quality > 0 && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} radius={0.65} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

