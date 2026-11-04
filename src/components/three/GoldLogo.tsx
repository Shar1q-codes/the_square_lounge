"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, DoubleSide, ExtrudeGeometry, MathUtils, SRGBColorSpace, type Group, type MeshBasicMaterial } from "three";
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

/** A soft round glow (radial gradient) for the halo behind the logo. */
function useGlowTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,214,140,1)");
    g.addColorStop(0.4, "rgba(235,165,60,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);
}

/** Turns per second of the slow spin. */
const SPIN = 0.09;

/** The hero centrepiece: the brand's controller-and-burger mark in polished gold, spinning slowly in space. */
export function GoldLogo({ mobile }: { mobile: boolean }) {
  const ref = useRef<Group>(null);
  const halo = useRef<MeshBasicMaterial>(null);
  const geometry = useLogoGeometry(mobile ? 4 : 8);
  const glow = useGlowTexture();

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
    if (halo.current) halo.current.opacity = (mobile ? 1 : 0.75) + Math.sin(t * 1.2) * 0.12;
  });

  return (
    <group position-z={-0.6}>
      {/* Warm key, fills and a rim from behind; outside the spinning group, so the logo stays lit all the way round. */}
      <pointLight position={[0, 1.5, 5]} intensity={120} distance={16} color="#ffe3a8" />
      <pointLight position={[-3.5, -1, 4]} intensity={60} distance={14} color="#f5d38a" />
      <pointLight position={[3.5, 0.5, 3]} intensity={50} distance={12} color="#fff1cf" />
      <pointLight position={[0, 0.5, -3]} intensity={60} distance={10} color="#ffc766" />
      {/* Halo of light behind the logo: one additive sprite, cheap enough for phones (which skip bloom). */}
      <mesh position-z={-1.4} scale={mobile ? 8 : 8.5}>
        <planeGeometry />
        <meshBasicMaterial
          ref={halo}
          map={glow}
          color={mobile ? "#ffb347" : "#ffcf7a"}
          transparent
          opacity={0.8}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <group ref={ref} scale={mobile ? 0.9 : 1}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#eec06a"
            metalness={0.6}
            roughness={0.28}
            clearcoat={0.7}
            clearcoatRoughness={0.12}
            emissive="#d99a2b"
            emissiveIntensity={0.85}
            envMapIntensity={3.2}
            side={DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
