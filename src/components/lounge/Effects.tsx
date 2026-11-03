"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RenderPipeline, type WebGPURenderer } from "three/webgpu";
import { float, pass, screenUV } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

/**
 * Glow on the LED strips and downlights plus a soft vignette, as a WebGPU render pipeline (TSL
 * nodes). Taking over rendering at priority 1 replaces R3F's own render call.
 */
export function Effects() {
  const gl = useThree((s) => s.gl) as unknown as WebGPURenderer;
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const pipeline = useMemo(() => {
    const scenePass = pass(scene, camera);
    const color = scenePass.getTextureNode("output");
    const glow = bloom(color, 0.7, 0.5, 1.6);
    const vignette = float(1).sub(screenUV.sub(0.5).length().mul(0.55));
    return new RenderPipeline(gl, color.add(glow).mul(vignette));
  }, [gl, scene, camera]);

  useEffect(() => () => pipeline.dispose(), [pipeline]);
  useFrame(() => pipeline.render(), 1);
  return null;
}
