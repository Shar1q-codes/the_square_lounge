"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import type { Station } from "@/config/site";
import { FONT_3D_DISPLAY } from "@/lib/fonts3d";
import { BLUE, glow, GOLD } from "./palette";
import { GlowFrame } from "./SquareFrame";

const W = 1.25;
const H = 0.74;

/** A floating glass screen for one station: PS5 glows gold, PS4 glows blue. Text only, no logos. */
export function StationScreen({ station }: { station: Station }) {
  const isPs5 = station.console === "PS5";
  const accent = isPs5 ? GOLD : BLUE;
  const edge = useMemo(() => glow(accent, isPs5 ? 2.6 : 3.2), [accent, isPs5]);
  const number = useMemo(() => glow(accent, isPs5 ? 1.6 : 2), [accent, isPs5]);
  const label = String(station.id).padStart(2, "0");

  return (
    <group>
      {/* Smoked glass */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshPhysicalMaterial
          color="#0c0c12"
          metalness={0.3}
          roughness={0.1}
          clearcoat={1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Soft inner wash of the accent colour */}
      <mesh position-z={0.002}>
        <planeGeometry args={[W * 0.94, H * 0.9]} />
        <meshBasicMaterial color={accent} transparent opacity={0.07} toneMapped={false} />
      </mesh>
      <GlowFrame width={W} height={H} thickness={0.016} depth={0.02} color={edge} />

      <Text
        font={FONT_3D_DISPLAY}
        fontSize={0.3}
        letterSpacing={-0.02}
        anchorX="left"
        anchorY="bottom"
        position={[-W / 2 + 0.09, -H / 2 + 0.07, 0.01]}
        color={number}
        material-toneMapped={false}
      >
        {label}
      </Text>
      <Text
        font={FONT_3D_DISPLAY}
        fontSize={0.085}
        letterSpacing={0.22}
        anchorX="right"
        anchorY="top"
        position={[W / 2 - 0.09, H / 2 - 0.08, 0.01]}
        color="#f5f5f7"
        fillOpacity={0.85}
      >
        {station.console}
      </Text>
    </group>
  );
}
