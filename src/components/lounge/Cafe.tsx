"use client";

import { CAFE_TABLES, COLORS } from "@/config/lounge";

const TOP = 0.74;

/** Dark wood top on black X-frame legs, like the folding tables in the photos. */
function Table({ withLaptop }: { withLaptop: boolean }) {
  return (
    <group>
      <mesh position-y={TOP}>
        <boxGeometry args={[1.2, 0.035, 0.62]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.55} />
      </mesh>
      {[-0.52, 0.52].map((x) => (
        <group key={x} position-x={x}>
          {[-1, 1].map((s) => (
            <mesh key={s} position-y={TOP / 2} rotation-x={s * 0.62}>
              <boxGeometry args={[0.03, 0.9, 0.03]} />
              <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
          <mesh position-y={0.015}>
            <boxGeometry args={[0.03, 0.03, 0.56]} />
            <meshStandardMaterial color="#141414" roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ))}
      {withLaptop && (
        <group position={[0.1, TOP + 0.02, 0.02]} rotation-y={0.3}>
          <mesh>
            <boxGeometry args={[0.34, 0.012, 0.24]} />
            <meshStandardMaterial color="#1b1f26" roughness={0.4} metalness={0.5} />
          </mesh>
          <group position={[0, 0.005, -0.12]} rotation-x={-1.85}>
            <mesh position-y={0.12}>
              <boxGeometry args={[0.34, 0.24, 0.01]} />
              <meshStandardMaterial color="#1b1f26" roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh position={[0, 0.12, -0.0055]} rotation-y={Math.PI}>
              <planeGeometry args={[0.31, 0.2]} />
              <meshBasicMaterial color="#2a3b52" />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}

/** Black slatted chair with arms (the plastic café chairs in the photos). */
function Chair() {
  const black = <meshStandardMaterial color={COLORS.chair} roughness={0.5} />;
  return (
    <group>
      <mesh position-y={0.45}>
        <boxGeometry args={[0.46, 0.04, 0.44]} />
        {black}
      </mesh>
      {[-0.16, -0.055, 0.055, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.72, -0.2]} rotation-x={-0.12}>
          <boxGeometry args={[0.07, 0.5, 0.02]} />
          {black}
        </mesh>
      ))}
      <mesh position={[0, 0.98, -0.23]} rotation-x={-0.12}>
        <boxGeometry args={[0.48, 0.05, 0.03]} />
        {black}
      </mesh>
      {[-0.23, 0.23].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.62, -0.02]}>
            <boxGeometry args={[0.04, 0.03, 0.42]} />
            {black}
          </mesh>
          {[-0.19, 0.19].map((z) => (
            <mesh key={z} position={[x * 0.92, 0.22, z]}>
              <boxGeometry args={[0.035, 0.45, 0.035]} />
              {black}
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Cafe() {
  return (
    <group>
      {CAFE_TABLES.map(([x, z], i) => (
        <group key={`${x}-${z}`} position={[x, 0, z]} rotation-y={Math.PI / 2}>
          <Table withLaptop={i === 0} />
          {[-0.3, 0.3].map((cx) => (
            <group key={cx}>
              <group position={[cx, 0, 0.62]} rotation-y={Math.PI}>
                <Chair />
              </group>
              <group position={[cx, 0, -0.62]}>
                <Chair />
              </group>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}
