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

/** Turns per second of the slow spin. */
const SPIN = 0.09;

/** The hero centrepiece: the brand's controller-and-burger mark in polished gold, spinning slowly in space. */
export function GoldLogo({ mobile }: { mobile: boolean }) {
  const ref = useRef<Group>(null);
  const geometry = useLogoGeometry(mobile ? 4 : 8);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    const dt = clampDelta(delta);
    const t = state.clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 3);
    g.rotation.y += dt * SPIN * Math.PI * 2;
    g.rotation.x = MathUtils.lerp(g.rotation.x, -0.1 - state.pointer.y * 0.15, k);
    g.rotation.z = Math.sin(t * 0.5) * 0.04;
    g.position.y = Math.sin(t * 0.8) * 0.08;
  });

  return (
    <group position-z={-0.6}>
      {/* Warm key and fill from the camera side; outside the spinning group, so the logo stays lit all the way round. */}
      <pointLight position={[0, 1.5, 5]} intensity={55} distance={14} color="#ffe3a8" />
      <pointLight position={[-3.5, -1, 4]} intensity={25} distance={12} color="#f5d38a" />
      <pointLight position={[3.5, 0.5, 3]} intensity={18} distance={10} color="#fff1cf" />
      <group ref={ref} scale={mobile ? 0.9 : 1}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#e8c477"
            metalness={0.8}
            roughness={0.22}
            clearcoat={0.6}
            clearcoatRoughness={0.15}
            emissive="#8a6526"
            emissiveIntensity={0.55}
            envMapIntensity={2.8}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
