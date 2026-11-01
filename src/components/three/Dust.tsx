"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, type ShaderMaterial } from "three";
import { GOLD_SOFT } from "./palette";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aSeed;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    // Slow drift, each mote on its own phase
    p.y += sin(uTime * 0.25 + aSeed * 6.2831) * 0.3;
    p.x += cos(uTime * 0.18 + aSeed * 12.566) * 0.2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Perspective size, clamped so a mote near the camera can never balloon
    float depth = max(-mv.z, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * (24.0 / depth), 1.0, 6.0 * uPixelRatio);

    // Gentle twinkle
    vAlpha = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    if (a < 0.01) discard;
    // Additive blending: alpha is always in [0, 1], so dust can only ever brighten
    gl_FragColor = vec4(uColor, clamp(a * vAlpha * uOpacity, 0.0, 1.0));
  }
`;

const BOUNDS = [14, 8, 10] as const;

/** Drifting gold dust: one draw call, animated entirely on the GPU. */
export function Dust({ mobile }: { mobile: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const count = mobile ? 200 : 600;

  const { positions, sizes, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BOUNDS[0];
      positions[i * 3 + 1] = (Math.random() - 0.5) * BOUNDS[1];
      positions[i * 3 + 2] = (Math.random() - 0.5) * BOUNDS[2];
      sizes[i] = 0.6 + Math.random() * 1.2;
      seeds[i] = Math.random();
    }
    return { positions, sizes, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new Color(GOLD_SOFT) },
      uOpacity: { value: mobile ? 0.8 : 0.65 },
    }),
    [mobile],
  );

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <points key={count} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
