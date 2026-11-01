"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Float } from "@react-three/drei";
import type { Group } from "three";
import { site } from "@/config/site";
import { clampDelta } from "./palette";
import { StationScreen } from "./StationScreen";

const RADIUS = 3.6;

/** One screen per station, in a slow tilted orbit. Each screen always faces the camera. */
export function ScreenOrbit() {
  const ref = useRef<Group>(null);
  const stations = site.stations;

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += clampDelta(delta) * 0.09;
  });

  return (
    // Tilted so screens pass below the headline in front and above it behind
    <group rotation={[0.32, 0, 0.05]}>
      <group ref={ref}>
        {stations.map((station, i) => {
          const angle = (i / stations.length) * Math.PI * 2;
          const y = Math.sin(i * 2.1) * 0.55;
          return (
            <group key={station.id} position={[Math.cos(angle) * RADIUS, y, Math.sin(angle) * RADIUS]}>
              <Float speed={1.1 + i * 0.12} rotationIntensity={0} floatIntensity={0.6} floatingRange={[-0.12, 0.12]}>
                <Billboard>
                  <StationScreen station={station} />
                </Billboard>
              </Float>
            </group>
          );
        })}
      </group>
    </group>
  );
}
