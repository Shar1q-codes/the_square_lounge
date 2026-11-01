"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import type { Mesh } from "three";
import { clampDelta } from "./palette";

/** Glossy black centrepiece. Its look comes almost entirely from environment reflections. */
export function ObsidianCube() {
  const ref = useRef<Mesh>(null);

  useFrame((state, delta) => {
    const m = ref.current;
    if (!m) return;
    m.rotation.y += clampDelta(delta) * 0.18;
    m.rotation.x = 0.45 + Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
  });

  return (
    <RoundedBox ref={ref} args={[1.5, 1.5, 1.5]} radius={0.07} smoothness={4} rotation={[0.45, 0.6, 0.2]}>
      <meshPhysicalMaterial
        color="#0a0a0f"
        metalness={0.75}
        roughness={0.14}
        clearcoat={1}
        clearcoatRoughness={0.08}
        envMapIntensity={1.4}
      />
    </RoundedBox>
  );
}
