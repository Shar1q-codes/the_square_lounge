"use client";

import { Suspense, useEffect, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Scene } from "./Scene";

type Props = {
  /** False while the hero is off-screen: rendering stops completely. */
  active: boolean;
  /** Scroll progress through the hero, 0 → 1. */
  progress: RefObject<number>;
  mobile: boolean;
  /** Called once everything inside Suspense (fonts) has loaded. */
  onReady: () => void;
};

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

/**
 * The hero's WebGL canvas. Loaded with next/dynamic (ssr: false) from HeroVisual.
 * Degrades gracefully: on sustained low FPS it drops to 1× DPR, and if that keeps
 * failing it switches post-processing off.
 */
export default function HeroCanvas({ active, progress, mobile, onReady }: Props) {
  const maxDpr = mobile ? 1.5 : 1.75;
  const [dpr, setDpr] = useState(maxDpr);
  const [effects, setEffects] = useState(true);

  return (
    <Canvas
      dpr={[1, dpr]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.8, 13], fov: 40, near: 0.1, far: 60 }}
      gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}    >
      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(maxDpr)}
        onFallback={() => {
          setDpr(1);
          setEffects(false);
        }}
      >
        <Suspense fallback={null}>
          <Scene mobile={mobile} effects={effects} progress={progress} />
          <Ready onReady={onReady} />
        </Suspense>
      </PerformanceMonitor>
    </Canvas>
  );
}
