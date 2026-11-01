"use client";

import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";

/**
 * Bloom only picks up materials pushed above 1.0 (luminanceThreshold 1), so the dark cube
 * and glass stay crisp while the frames and screen edges glow. Phones get a lighter chain.
 */
export function Effects({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.8} radius={0.7} levels={5} />
        <Vignette offset={0.25} darkness={0.8} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={1} radius={0.75} />
      <Vignette offset={0.25} darkness={0.8} />
      <Noise premultiply opacity={0.25} />
    </EffectComposer>
  );
}
