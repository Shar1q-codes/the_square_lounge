"use client";

import { useMemo } from "react";
import { DoubleSide, PlaneGeometry } from "three";
import { MONOGRAM } from "@/components/brand/logoPaths";
import {
  AC_UNITS,
  BACK_DOOR_Z,
  BANNER,
  BIN,
  CCTV,
  COLORS,
  CURTAINS,
  ENTRANCE_Z,
  FACING,
  POSTERS,
  ROOM,
  type WallName,
} from "@/config/lounge";
import { bannerArt, pleats, posterArt, stairwell } from "./textures";

const { length: L, width: W, height: H } = ROOM;

/** Where a point `along` a wall sits in the room, `out` metres from its surface. */
function onWall(wall: WallName, along: number, out: number): [number, number] {
  switch (wall) {
    case "left":
      return [along, out];
    case "right":
      return [along, W - out];
    case "front":
      return [out, along];
    case "back":
      return [L - out, along];
  }
}

/** Colours of the real posters (game art in purples, blues, reds; football art in gold and blue). */
const POSTER_STYLES = [
  { from: "#3a0f5c", to: "#ff5fa2", accent: "#ffd166", motif: "wave" as const },
  { from: "#0a1b3d", to: "#1e88e5", accent: "#7fdbff", motif: "grid" as const },
  { from: "#2b0a0a", to: "#d62828", accent: "#ffb703", motif: "burst" as const },
  { from: "#0d1b2a", to: "#3a86ff", accent: "#ffffff", motif: "rings" as const },
  { from: "#1a1206", to: "#c9a227", accent: "#fff3b0", motif: "bolt" as const },
];

function Poster({ wall, along, y, style, size }: (typeof POSTERS)[number]) {
  const art = useMemo(() => posterArt(POSTER_STYLES[style % POSTER_STYLES.length], along * 100 + style), [along, style]);
  const [x, z] = onWall(wall, along, 0.012);
  return (
    <group position={[x, y, z]} rotation-y={FACING[wall]}>
      <mesh>
        <boxGeometry args={[size[0] + 0.05, size[1] + 0.05, 0.02]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh position-z={0.011}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={art} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A wavy plane: the folds of a curtain. */
function curtainGeometry(width: number, height: number, folds: number) {
  const geometry = new PlaneGeometry(width, height, folds * 6, 1);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, Math.sin((pos.getX(i) / width) * Math.PI * 2 * folds) * 0.045 + 0.06);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function Curtain({ from, to }: { from: number; to: number }) {
  const width = to - from;
  const folds = Math.round(width * 4);
  const geometry = useMemo(() => curtainGeometry(width, H - 0.15, folds), [width, folds]);
  const tex = useMemo(() => pleats(COLORS.curtain, folds), [folds]);
  return (
    <group position={[L, (H - 0.15) / 2 + 0.04, (from + to) / 2]} rotation-y={FACING.back}>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={tex} roughness={0.85} side={DoubleSide} />
      </mesh>
      <mesh position={[0, (H - 0.15) / 2 + 0.03, 0.08]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.015, 0.015, width + 0.3, 8]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function AcUnit({ wall, along }: (typeof AC_UNITS)[number]) {
  const [x, z] = onWall(wall, along, 0.12);
  return (
    <group position={[x, H - 0.45, z]} rotation-y={FACING[wall]}>
      <mesh>
        <boxGeometry args={[0.95, 0.3, 0.22]} />
        <meshStandardMaterial color="#f6f7f8" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.11, 0.111]}>
        <planeGeometry args={[0.85, 0.05]} />
        <meshStandardMaterial color="#d3d6d9" roughness={0.6} />
      </mesh>
      <mesh position={[0.34, 0.06, 0.112]}>
        <planeGeometry args={[0.08, 0.03]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

function Cctv({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position-y={-0.02}>
        <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.5} />
      </mesh>
      <mesh position-y={-0.04} rotation-x={Math.PI}>
        <sphereGeometry args={[0.055, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#1a1c20" roughness={0.1} clearcoat={1} />
      </mesh>
    </group>
  );
}

export function Details() {
  const stairs = useMemo(stairwell, []);
  const banner = useMemo(() => bannerArt(MONOGRAM.d, [MONOGRAM.width, MONOGRAM.height]), []);

  return (
    <group>
      {POSTERS.map((p) => (
        <Poster key={`${p.wall}-${p.along}`} {...p} />
      ))}
      {CURTAINS.map(([from, to]) => (
        <Curtain key={from} from={from} to={to} />
      ))}
      {AC_UNITS.map((a) => (
        <AcUnit key={`${a.wall}-${a.along}`} {...a} />
      ))}
      {CCTV.map((p) => (
        <Cctv key={p.join()} position={[p[0], p[1], p[2]]} />
      ))}

      {/* Glass entrance door, with the lit stairwell behind it */}
      <group position={[0.012, 0, ENTRANCE_Z]} rotation-y={FACING.front}>
        <mesh position-y={1.07}>
          <planeGeometry args={[1.0, 2.1]} />
          <meshStandardMaterial map={stairs} roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.07, 0.01]}>
          <planeGeometry args={[1.0, 2.1]} />
          <meshPhysicalMaterial color="#cfe8ec" transmission={0} transparent opacity={0.22} roughness={0.05} clearcoat={1} />
        </mesh>
        {[-0.52, 0.52].map((x) => (
          <mesh key={x} position={[x, 1.08, 0.02]}>
            <boxGeometry args={[0.05, 2.16, 0.05]} />
            <meshStandardMaterial color="#c8ccd0" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 2.15, 0.02]}>
          <boxGeometry args={[1.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#c8ccd0" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.38, 1.05, 0.05]}>
          <boxGeometry args={[0.03, 0.3, 0.03]} />
          <meshStandardMaterial color="#e5e7ea" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Wooden door on the far wall, in the left corner by the curtains */}
      <group position={[L - 0.012, 0, BACK_DOOR_Z]} rotation-y={FACING.back}>
        <mesh position-y={1.05}>
          <boxGeometry args={[0.95, 2.1, 0.04]} />
          <meshStandardMaterial color="#5a3a24" roughness={0.6} />
        </mesh>
        <mesh position={[0.36, 1.0, 0.03]}>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color="#c9a24f" metalness={1} roughness={0.25} />
        </mesh>
      </group>

      {/* Standing banner */}
      <group position={[BANNER.position[0], 0, BANNER.position[1]]} rotation-y={BANNER.rotation}>
        <mesh position-y={1.0}>
          <planeGeometry args={[0.8, 1.9]} />
          <meshStandardMaterial map={banner} roughness={0.5} side={DoubleSide} />
        </mesh>
        <mesh position-y={0.02}>
          <boxGeometry args={[0.86, 0.04, 0.3]} />
          <meshStandardMaterial color="#1c1c1f" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Teal dustbin */}
      <mesh position={[BIN[0], 0.28, BIN[1]]}>
        <cylinderGeometry args={[0.2, 0.16, 0.56, 24]} />
        <meshStandardMaterial color="#1fb5a3" roughness={0.45} />
      </mesh>
    </group>
  );
}
