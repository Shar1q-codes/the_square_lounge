"use client";

import { useMemo } from "react";
import { Path, Shape, ShapeGeometry, type Texture } from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { reflector, texture } from "three/tsl";
import { COLORS, PILLARS, ROOM, type Vec2 } from "@/config/lounge";
import { ceilingGrid, floorTiles } from "./textures";

const { length: L, width: W, height: H, tray, panel } = ROOM;

/** Each wall faces into the room; walls run 0.5 m above the lower ceiling to close the gap to the tray. */
const WALLS: { key: string; position: [number, number, number]; rotation: number; width: number }[] = [
  { key: "left", position: [L / 2, 0, 0], rotation: 0, width: L },
  { key: "right", position: [L / 2, 0, W], rotation: Math.PI, width: L },
  { key: "front", position: [0, 0, W / 2], rotation: Math.PI / 2, width: W },
  { key: "back", position: [L, 0, W / 2], rotation: -Math.PI / 2, width: W },
];

/** A horizontal ring (outer rectangle minus an inner one) at height y, facing down. */
function ceilingRing(outer: [Vec2, Vec2] | null, inner: [Vec2, Vec2]) {
  const [ox, oz] = outer ?? [[0, L], [0, W]];
  const shape = new Shape().moveTo(ox[0], oz[0]).lineTo(ox[1], oz[0]).lineTo(ox[1], oz[1]).lineTo(ox[0], oz[1]).closePath();
  const [ix, iz] = inner;
  shape.holes.push(new Path().moveTo(ix[0], iz[0]).lineTo(ix[0], iz[1]).lineTo(ix[1], iz[1]).lineTo(ix[1], iz[0]).closePath());
  return new ShapeGeometry(shape);
}

/** The vertical fascia around a raised ceiling opening, from y0 up to y1: four inward-facing strips. */
function Fascia({ x, z, y0, y1 }: { x: Vec2; z: Vec2; y0: number; y1: number }) {
  const h = y1 - y0;
  const y = y0 + h / 2;
  const cx = (x[0] + x[1]) / 2;
  const cz = (z[0] + z[1]) / 2;
  const sx = x[1] - x[0];
  const sz = z[1] - z[0];
  const sides: { position: [number, number, number]; rotation: number; width: number }[] = [
    { position: [cx, y, z[0]], rotation: 0, width: sx },
    { position: [cx, y, z[1]], rotation: Math.PI, width: sx },
    { position: [x[0], y, cz], rotation: Math.PI / 2, width: sz },
    { position: [x[1], y, cz], rotation: -Math.PI / 2, width: sz },
  ];
  return (
    <group>
      {sides.map((s, i) => (
        <mesh key={i} position={s.position} rotation-y={s.rotation}>
          <planeGeometry args={[s.width, h]} />
          <meshStandardMaterial color={COLORS.ceiling} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Glossy tiles that reflect the room (the lights and screens) at half resolution: three.js's
 * WebGPU reflector node, which re-renders the scene from below the floor once per frame.
 */
function ReflectiveFloor({ tiles }: { tiles: Texture }) {
  const { material, target } = useMemo(() => {
    const reflection = reflector({ resolutionScale: 0.5 });
    reflection.target.rotateX(-Math.PI / 2);
    const m = new MeshStandardNodeMaterial({ roughness: 0.18, metalness: 0.05 });
    m.colorNode = texture(tiles);
    m.emissiveNode = reflection.mul(0.3);
    return { material: m, target: reflection.target };
  }, [tiles]);
  return (
    <>
      <primitive object={target} position={[L / 2, 0, W / 2]} />
      <mesh rotation-x={-Math.PI / 2} position={[L / 2, 0, W / 2]} material={material}>
        <planeGeometry args={[L, W]} />
      </mesh>
    </>
  );
}

/** Floor, walls, pillars and the stepped false ceiling (lights are in CeilingLights). */
export function Room({ reflections }: { reflections: boolean }) {
  const tiles = useMemo(() => floorTiles(L, W, COLORS.floor, COLORS.grout), []);
  const grid = useMemo(() => ceilingGrid(panel.x[1] - panel.x[0], panel.z[1] - panel.z[0]), []);
  const lower = useMemo(() => ceilingRing(null, [tray.x, tray.z]), []);
  const upper = useMemo(() => ceilingRing([tray.x, tray.z], [panel.x, panel.z]), []);
  const trayTop = H + tray.rise;
  const panelTop = trayTop + panel.rise;

  return (
    <group>
      {/* Floor: reflections on capable devices, plain glossy tiles otherwise */}
      {reflections ? (
        <ReflectiveFloor tiles={tiles} />
      ) : (
        <mesh rotation-x={-Math.PI / 2} position={[L / 2, 0, W / 2]}>
          <planeGeometry args={[L, W]} />
          <meshStandardMaterial map={tiles} roughness={0.2} metalness={0.05} />
        </mesh>
      )}

      {/* Four walls (separate planes: a box would also cap the floor and ceiling) with a pale skirting */}
      {WALLS.map((w) => (
        <group key={w.key} position={w.position} rotation-y={w.rotation}>
          <mesh position-y={H / 2 + 0.25}>
            <planeGeometry args={[w.width, H + 0.5]} />
            <meshStandardMaterial color={COLORS.wall} roughness={0.92} />
          </mesh>
          <mesh position={[0, 0.05, 0.004]}>
            <planeGeometry args={[w.width, 0.1]} />
            <meshStandardMaterial color="#dfe3e1" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Stepped ceiling: lower ring, tray ring, grid panel, with fascias between */}
      <mesh geometry={lower} rotation-x={Math.PI / 2} position-y={H - 0.001}>
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.95} />
      </mesh>
      <Fascia x={tray.x} z={tray.z} y0={H} y1={trayTop} />
      <mesh geometry={upper} rotation-x={Math.PI / 2} position-y={trayTop - 0.001}>
        <meshStandardMaterial color={COLORS.ceiling} roughness={0.95} />
      </mesh>
      <Fascia x={panel.x} z={panel.z} y0={trayTop} y1={panelTop} />
      <mesh rotation-x={Math.PI / 2} position={[(panel.x[0] + panel.x[1]) / 2, panelTop, (panel.z[0] + panel.z[1]) / 2]}>
        <planeGeometry args={[panel.x[1] - panel.x[0], panel.z[1] - panel.z[0]]} />
        <meshStandardMaterial map={grid} roughness={0.9} />
      </mesh>

      {/* Square aqua columns */}
      {PILLARS.map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, H / 2, z]}>
          <boxGeometry args={[0.45, H, 0.45]} />
          <meshStandardMaterial color={COLORS.pillar} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
