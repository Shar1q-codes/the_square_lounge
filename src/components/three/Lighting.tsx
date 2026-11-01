"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { BLUE, GOLD } from "./palette";

/**
 * Studio lighting built from Lightformer panels: no HDR file to download.
 * The environment is rendered once (frames={1}) and only used for reflections.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} color="#fff4e0" />
      <pointLight position={[-5, -1, -4]} intensity={30} distance={14} color={BLUE} />

      <Environment resolution={256} frames={1} background={false}>
        {/* Overhead softbox */}
        <Lightformer form="rect" intensity={1.6} color="#ffffff" scale={[10, 4, 1]} position={[0, 6, 0]} target={[0, 0, 0]} />
        {/* Warm gold strip, camera left */}
        <Lightformer form="rect" intensity={3} color={GOLD} scale={[1.2, 8, 1]} position={[-6, 1, 2]} target={[0, 0, 0]} />
        {/* Cool blue strip, camera right */}
        <Lightformer form="rect" intensity={2} color={BLUE} scale={[1, 8, 1]} position={[6, 0, -2]} target={[0, 0, 0]} />
        {/* Ring behind for a crisp rim highlight */}
        <Lightformer form="ring" intensity={1.5} color="#ffffff" scale={4} position={[0, 1, -8]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}
