"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, MeshBasicMaterial, Vector2, type PointLight } from "three";
import { COLORS, COVE_CYCLE, PERIMETER_CYCLE, ROOM, type Vec2 } from "@/config/lounge";

const { length: L, width: W, height: H, tray, panel } = ROOM;
const TRAY_TOP = H + tray.rise;

/** A glowing strip: an emissive bar the bloom pass turns into an LED line. */
function Strip({ from, to, y, material, thickness = 0.035 }: { from: Vec2; to: Vec2; y: number; material: MeshBasicMaterial; thickness?: number }) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  return (
    <mesh position={[(from[0] + to[0]) / 2, y, (from[1] + to[1]) / 2]} rotation-y={-Math.atan2(dz, dx)} material={material}>
      <boxGeometry args={[length, 0.015, thickness]} />
    </mesh>
  );
}

/** A rectangle of strips (a cove line around an opening). */
function Loop({ x, z, y, material, inset = 0 }: { x: Vec2; z: Vec2; y: number; material: MeshBasicMaterial; inset?: number }) {
  const [x0, x1] = [x[0] - inset, x[1] + inset];
  const [z0, z1] = [z[0] - inset, z[1] + inset];
  const corners: Vec2[] = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  return (
    <group>
      {corners.map((c, i) => (
        <Strip key={i} from={c} to={corners[(i + 1) % 4]} y={y} material={material} thickness={0.06} />
      ))}
    </group>
  );
}

/** The cyan line strips on the tray: three-line chevrons from each panel corner, plus three lines along each long side. */
function chevronStrips(): [Vec2, Vec2][] {
  const strips: [Vec2, Vec2][] = [];
  const panelCorners: Vec2[] = [[panel.x[0], panel.z[0]], [panel.x[1], panel.z[0]], [panel.x[1], panel.z[1]], [panel.x[0], panel.z[1]]];
  const trayCorners: Vec2[] = [[tray.x[0], tray.z[0]], [tray.x[1], tray.z[0]], [tray.x[1], tray.z[1]], [tray.x[0], tray.z[1]]];
  panelCorners.forEach((p, i) => {
    const dir = new Vector2(trayCorners[i][0] - p[0], trayCorners[i][1] - p[1]).normalize();
    const side = new Vector2(-dir.y, dir.x);
    for (const k of [-1, 0, 1]) {
      const start = new Vector2(...p).addScaledVector(dir, 0.35).addScaledVector(side, k * 0.28);
      const end = start.clone().addScaledVector(dir, 2.2 - Math.abs(k) * 0.35);
      strips.push([[start.x, start.y], [end.x, end.y]]);
    }
  });
  for (const zEdge of [tray.z[0], tray.z[1]]) {
    const sign = zEdge === tray.z[0] ? 1 : -1;
    for (const k of [0, 1, 2]) {
      const z = zEdge + sign * (0.3 + k * 0.22);
      strips.push([[panel.x[0] - 0.4, z], [panel.x[1] + 0.4, z]]);
    }
  }
  return strips;
}

/** Recessed round downlights around the room and on the tray. */
function downlightSpots(): [number, number, number][] {
  const spots: [number, number, number][] = [];
  for (let x = 1.2; x < L; x += 2.1) {
    spots.push([x, H, 0.7], [x, H, W - 0.7]);
  }
  for (const z of [2.6, 4.5, 6.4]) spots.push([0.9, H, z], [L - 0.9, H, z]);
  for (const [x, z] of [[3.6, 4.5], [11.4, 4.5], [7.5, 2.2], [7.5, 6.8]] as Vec2[]) spots.push([x, TRAY_TOP, z]);
  return spots;
}

/** Positions of the real light sources (fewer than the visible downlights, for speed). */
const LAMPS: Vec2[] = [[2.5, 2.2], [2.5, 6.8], [7.5, 2.2], [7.5, 6.8], [12.5, 2.2], [12.5, 6.8]];

export function CeilingLights({ motion }: { motion: boolean }) {
  const cyan = useMemo(() => new MeshBasicMaterial({ color: new Color(COLORS.ledCyan).multiplyScalar(3.2), toneMapped: false }), []);
  const cove = useMemo(() => new MeshBasicMaterial({ color: new Color(COVE_CYCLE[0]), toneMapped: false }), []);
  const perimeter = useMemo(() => new MeshBasicMaterial({ color: new Color(PERIMETER_CYCLE[0]), toneMapped: false }), []);
  const downlight = useMemo(() => new MeshBasicMaterial({ color: new Color("#fff6e6").multiplyScalar(4), toneMapped: false }), []);
  const strips = useMemo(chevronStrips, []);
  const spots = useMemo(downlightSpots, []);
  const coveLight = useRef<PointLight>(null);
  const tmp = useMemo(() => [new Color(), new Color()], []);

  // Slow colour cycle, like the RGB coves in the photos (held still with reduced motion).
  useFrame((state) => {
    const t = motion ? state.clock.elapsedTime / 6 : 0;
    const blend = (cycle: readonly string[], out: Color, strength: number) => {
      const i = Math.floor(t) % cycle.length;
      tmp[0].set(cycle[i]);
      tmp[1].set(cycle[(i + 1) % cycle.length]);
      return out.copy(tmp[0]).lerp(tmp[1], t - Math.floor(t)).multiplyScalar(strength);
    };
    blend(COVE_CYCLE, cove.color, 4);
    blend(PERIMETER_CYCLE, perimeter.color, 3);
    if (coveLight.current) coveLight.current.color.copy(cove.color).multiplyScalar(0.25);
  });

  return (
    <group>
      {strips.map(([from, to], i) => (
        <Strip key={i} from={from} to={to} y={TRAY_TOP - 0.01} material={cyan} />
      ))}
      <Loop x={panel.x} z={panel.z} y={TRAY_TOP - 0.01} material={cove} inset={0.06} />
      <Loop x={tray.x} z={tray.z} y={H - 0.01} material={perimeter} inset={0.06} />

      {spots.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] - 0.005, p[2]]} rotation-x={Math.PI / 2} material={downlight}>
          <circleGeometry args={[0.09, 20]} />
        </mesh>
      ))}

      {/* Real light: soft fill from above, warm-white lamps under the downlights, a tinted glow under the cove */}
      <hemisphereLight args={["#ffffff", "#c9d8da", 0.9]} />
      {LAMPS.map(([x, z]) => (
        <pointLight key={`${x}-${z}`} position={[x, 1.9, z]} intensity={5} distance={8} decay={1.4} color="#fff3df" />
      ))}
      <pointLight ref={coveLight} position={[7.5, 2.3, 4.5]} intensity={6} distance={7} decay={1.4} />
    </group>
  );
}
