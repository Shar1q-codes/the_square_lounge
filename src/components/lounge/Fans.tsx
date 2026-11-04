"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { ROOM, type Vec2 } from "@/config/lounge";

/** Fan positions [x, z] and whether each hangs from the raised tray. */
const FANS: { at: Vec2; tray: boolean }[] = [
  { at: [3.6, 2.4], tray: true },
  { at: [3.6, 6.6], tray: true },
  { at: [11.4, 2.4], tray: true },
  { at: [11.4, 6.6], tray: true },
  { at: [1.0, 4.5], tray: false },
  { at: [14.0, 4.5], tray: false },
];

/** A black three-blade ceiling fan with the gold ring under the motor, as in the photos. */
function Fan({ x, z, top, motion }: { x: number; z: number; top: number; motion: boolean }) {
  const rotor = useRef<Group>(null);
  useFrame((_, delta) => {
    if (motion && rotor.current) rotor.current.rotation.y += Math.min(delta, 0.1) * 5;
  });
  const hub = top - 0.42;
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={top - 0.15}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 8]} />
        <meshStandardMaterial color="#111" roughness={0.4} metalness={0.6} />
      </mesh>
      <group ref={rotor} position-y={hub}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.12, 0.14, 24]} />
          <meshStandardMaterial color="#121214" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position-y={-0.075} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.1, 0.012, 8, 32]} />
          <meshStandardMaterial color="#c9a24f" roughness={0.25} metalness={1} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation-y={(i * Math.PI * 2) / 3}>
            <mesh position={[0.48, 0, 0]} rotation-x={0.12}>
              <boxGeometry args={[0.72, 0.012, 0.13]} />
              <meshStandardMaterial color="#141416" roughness={0.45} metalness={0.3} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function Fans({ motion }: { motion: boolean }) {
  return (
    <group>
      {FANS.map(({ at: [x, z], tray }) => (
        <Fan key={`${x}-${z}`} x={x} z={z} top={tray ? ROOM.height + ROOM.tray.rise : ROOM.height} motion={motion} />
      ))}
    </group>
  );
}
