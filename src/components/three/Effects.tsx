"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/**
 * Desktop only (phones render without post-processing). Bloom picks up the logo's brightest
 * highlights (luminanceThreshold 0.9); 4× multisampling keeps its edges crisp.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.9} radius={0.7} />
      <Vignette offset={0.25} darkness={0.7} />
    </EffectComposer>
  );
}
