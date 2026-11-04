"use client";

import type { RefObject } from "react";
import { BG } from "./palette";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { GoldLogo } from "./GoldLogo";
import { Lighting } from "./Lighting";

type Props = {
  mobile: boolean;
  effects: boolean;
  progress: RefObject<number>;
};

export function Scene({ mobile, effects, progress }: Props) {
  return (
    <>
      <color attach="background" args={[BG]} />
      <Lighting />

      <group position-y={0.15}>
        <GoldLogo mobile={mobile} />
      </group>

      <CameraRig progress={progress} />
      {effects && <Effects />}
    </>
  );
}
