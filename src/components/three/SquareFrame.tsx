"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Color, Group } from "three";
import { clampDelta, glow, GOLD } from "./palette";

type GlowFrameProps = {
  width: number;
  height: number;
  thickness: number;
  depth?: number;
  color: Color;
};

/** A rectangular outline built from four emissive bars. Bloom turns it into a glowing frame. */
export function GlowFrame({ width, height, thickness, depth = thickness, color }: GlowFrameProps) {
  const bars: { position: [number, number, number]; scale: [number, number, number] }[] = [
    { position: [0, height / 2, 0], scale: [width + thickness, thickness, depth] },
    { position: [0, -height / 2, 0], scale: [width + thickness, thickness, depth] },
    { position: [-width / 2, 0, 0], scale: [thickness, height - thickness, depth] },
    { position: [width / 2, 0, 0], scale: [thickness, height - thickness, depth] },
  ];
  return (
    <group>
      {bars.map((bar, i) => (
        <mesh key={i} position={bar.position} scale={bar.scale}>
          <boxGeometry />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The hero's signature: a glowing gold square, set on its point, slowly turning around the cube. */
export function SquareFrame() {
  const ref = useRef<Group>(null);
  const main = useMemo(() => glow(GOLD, 3.2), []);
  const faint = useMemo(() => glow(GOLD, 0.9), []);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.y += clampDelta(delta) * 0.12;
    g.rotation.x = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
  });

  return (
    <group ref={ref}>
      <group rotation-z={Math.PI / 4}>
        <GlowFrame width={2.9} height={2.9} thickness={0.05} color={main} />
      </group>
      <group rotation-z={Math.PI / 4} position-z={-0.25}>
        <GlowFrame width={3.5} height={3.5} thickness={0.012} color={faint} />
      </group>
    </group>
  );
}
