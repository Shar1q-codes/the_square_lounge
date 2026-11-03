"use client";

import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import { SphereGeometry } from "three";
import { BEAN_BAGS, COLORS, SOFAS } from "@/config/lounge";
import { quilted } from "./textures";

const SEAT_WIDTH = 0.62;

/** The grey-green sofa from the photos: quilted seat and tall diamond-quilted back, square cushions. */
function Sofa({ seats, position, rotation }: (typeof SOFAS)[number]) {
  const width = seats * SEAT_WIDTH + 0.16;
  const seatTex = useMemo(() => quilted(COLORS.sofa, [seats * 1.5, 1]), [seats]);
  const backTex = useMemo(() => quilted(COLORS.sofa, [seats * 1.5, 1.2]), [seats]);
  return (
    <group position={[position[0], 0, position[1]]} rotation-y={rotation}>
      <mesh position-y={0.09}>
        <boxGeometry args={[width - 0.04, 0.18, 0.7]} />
        <meshStandardMaterial color={COLORS.sofaDark} roughness={0.9} />
      </mesh>
      <RoundedBox args={[width, 0.2, 0.78]} radius={0.05} smoothness={3} position={[0, 0.28, 0.04]}>
        <meshStandardMaterial map={seatTex} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[width, 0.62, 0.17]} radius={0.05} smoothness={3} position={[0, 0.69, -0.32]}>
        <meshStandardMaterial map={backTex} roughness={0.85} />
      </RoundedBox>
      {Array.from({ length: seats }, (_, i) => (
        <RoundedBox
          key={i}
          args={[0.38, 0.36, 0.1]}
          radius={0.045}
          smoothness={3}
          position={[(i - (seats - 1) / 2) * SEAT_WIDTH + (i % 2 ? 0.06 : -0.04), 0.56, -0.18]}
          rotation={[-0.25, (i % 2 ? 1 : -1) * 0.12, (i % 2 ? -1 : 1) * 0.1]}
        >
          <meshStandardMaterial color={COLORS.sofa} roughness={0.9} />
        </RoundedBox>
      ))}
    </group>
  );
}

/**
 * A slumped leather bean bag: a sphere flattened on the floor, pushed up at the back and dipped
 * where you sit, with a few lumps so no two look alike.
 */
function beanBagGeometry(seed: number) {
  const geometry = new SphereGeometry(0.46, 36, 24);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / 0.46;
    const y = pos.getY(i) / 0.46;
    const z = pos.getZ(i) / 0.46;
    const lump = 1 + 0.05 * Math.sin(3 * Math.atan2(z, x) + seed) + 0.04 * Math.sin(5 * y + seed * 2);
    let ny = y * 0.55;
    if (ny < -0.2) ny = -0.2 + (ny + 0.2) * 0.08; // flat where it rests on the floor
    ny += 0.3 * Math.max(0, -z) * Math.max(0, y); // raised back
    ny -= 0.14 * Math.max(0, z) * Math.max(0, y); // seat dip
    pos.setXYZ(i, x * 0.46 * lump, (ny + 0.21) * 0.46, z * 0.46 * lump * 1.05);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function BeanBag({ position, color }: (typeof BEAN_BAGS)[number]) {
  const seed = (position[0] * 7.3 + position[1] * 3.1) % 6.28;
  const geometry = useMemo(() => beanBagGeometry(seed), [seed]);
  return (
    <mesh geometry={geometry} position={[position[0], 0, position[1]]} rotation-y={seed}>
      <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} />
    </mesh>
  );
}

export function Seating() {
  return (
    <group>
      {SOFAS.map((s) => (
        <Sofa key={`${s.position[0]}-${s.position[1]}`} {...s} />
      ))}
      {BEAN_BAGS.map((b) => (
        <BeanBag key={`${b.position[0]}-${b.position[1]}`} {...b} />
      ))}
    </group>
  );
}
