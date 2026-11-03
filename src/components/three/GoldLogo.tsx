"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, ExtrudeGeometry, MathUtils, type Group } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { CONTROLLER_BURGER } from "@/components/brand/logoPaths";
import { clampDelta } from "./palette";

/** World width of the logo; the old cube was 1.5 wide (≈2.6 on its diagonal). */
const WIDTH = 4.4;

/** Extrudes the traced controller-and-burger path into a bevelled solid, centred and scaled to WIDTH. */
function useLogoGeometry(curveSegments: number) {
  return useMemo(() => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000" fill-rule="evenodd" d="${CONTROLLER_BURGER.d}"/></svg>`;
    const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));
    const geometry = new ExtrudeGeometry(shapes, {
      depth: 70,
      curveSegments,
      bevelEnabled: true,
      bevelThickness: 14,
      bevelSize: 6,
      bevelSegments: 3,
    });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    geometry.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, -(box.min.z + box.max.z) / 2);
    const s = WIDTH / CONTROLLER_BURGER.width;
    // SVG y points down; flipping it mirrors triangle winding, so the material is double-sided.
    geometry.scale(s, -s, s);
    geometry.computeVertexNormals();
    return geometry;
  }, [curveSegments]);
}

/** The hero centrepiece: the brand's controller-and-burger mark in polished gold, swaying towards the pointer. */
export function GoldLogo({ mobile }: { mobile: boolean }) {
  const ref = useRef<Group>(null);
  const geometry = useLogoGeometry(mobile ? 4 : 8);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-clampDelta(delta) * 3);
    g.rotation.y = MathUtils.lerp(g.rotation.y, Math.sin(t * 0.35) * 0.35 + state.pointer.x * 0.35, k);
    g.rotation.x = MathUtils.lerp(g.rotation.x, -0.12 - state.pointer.y * 0.18, k);
    g.position.set(0, Math.sin(t * 0.8) * 0.06, -0.6);
  });

  return (
    <group ref={ref} position-z={-0.6} scale={mobile ? 0.8 : 1}>
      {/* Warm key + fill just for the logo: the hero's studio lighting was tuned for a black cube. */}
      <pointLight position={[0, 1.5, 4]} intensity={40} distance={12} color="#ffe3a8" />
      <pointLight position={[-3, -1, 3]} intensity={18} distance={10} color="#f5d38a" />
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color="#e2bf74"
          metalness={0.85}
          roughness={0.26}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          emissive="#6b4e20"
          emissiveIntensity={0.4}
          envMapIntensity={2.4}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
