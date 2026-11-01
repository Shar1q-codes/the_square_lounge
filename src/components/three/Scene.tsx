"use client";

import type { RefObject } from "react";
import { BG } from "./palette";
import { CameraRig } from "./CameraRig";
import { Dust } from "./Dust";
import { Effects } from "./Effects";
import { Lighting } from "./Lighting";
import { ObsidianCube } from "./ObsidianCube";
import { ScreenOrbit } from "./ScreenOrbit";
import { SquareFrame } from "./SquareFrame";

type Props = {
  mobile: boolean;
  effects: boolean;
  progress: RefObject<number>;
};

export function Scene({ mobile, effects, progress }: Props) {
  return (
    <>
      <color attach="background" args={[BG]} />
      <fog attach="fog" args={[BG, 14, 30]} />
      <Lighting />

      <group position-y={0.15}>
        <ObsidianCube />
        <SquareFrame />
        <ScreenOrbit />
      </group>

      <Dust mobile={mobile} />
      <CameraRig progress={progress} />
      {effects && <Effects mobile={mobile} />}
    </>
  );
}
