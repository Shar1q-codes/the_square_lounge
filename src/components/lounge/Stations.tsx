"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Vector3, type Group, type Object3D } from "three";
import { COLORS, PILLARS, ROOM, STATIONS, type Station } from "@/config/lounge";
import { StationScreen, type ScreenState } from "./StationScreen";
import { marble } from "./textures";

/** Screen width and height in metres for a 16:9 TV of a given diagonal. */
export function screenSize(inches: number): [number, number] {
  const d = inches * 0.0254;
  return [(d * 16) / Math.hypot(16, 9), (d * 9) / Math.hypot(16, 9)];
}

const TABLE = { width: 0.95, height: 0.6, depth: 0.42 };

function Console({ kind }: { kind: Station["console"] }) {
  if (kind === "PS5") {
    // Lying flat, as on the tables in the photos: white shell, black centre band.
    return (
      <group position-y={TABLE.height + 0.055}>
        <mesh>
          <boxGeometry args={[0.39, 0.1, 0.26]} />
          <meshStandardMaterial color="#f4f5f7" roughness={0.35} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.392, 0.03, 0.2]} />
          <meshStandardMaterial color="#111216" roughness={0.3} metalness={0.3} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position-y={TABLE.height + 0.028}>
      <boxGeometry args={[0.3, 0.055, 0.27]} />
      <meshStandardMaterial color="#0d0e11" roughness={0.25} metalness={0.2} />
    </mesh>
  );
}

type StationProps = {
  station: Station;
  screen: ScreenState;
  playTrailer: boolean;
  occluders: RefObject<Object3D | null>;
  onSelect?: (station: Station) => void;
};

/** One gaming station: TV on the wall, marble console table and console below it. */
function StationUnit({ station, screen, playTrailer, occluders, onSelect }: StationProps) {
  const [w, h] = screenSize(station.inches);
  const stone = useMemo(marble, []);
  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag that ends on a TV is looking around, not a tap.
    if (e.delta > 6) return;
    onSelect?.(station);
  };

  return (
    <group position={[station.position[0], 0, station.position[2]]} rotation-y={station.facing}>
      {/* TV */}
      <group position={[0, station.position[1], 0.04]} onClick={select} userData={{ stationId: station.id }}>
        <mesh>
          <boxGeometry args={[w + 0.03, h + 0.03, 0.05]} />
          <meshStandardMaterial color={COLORS.tvBezel} roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position-z={0.026}>
          <planeGeometry args={[w, h]} />
          <meshPhysicalMaterial color="#05070a" roughness={0.08} metalness={0.1} clearcoat={1} emissive="#0b1d3a" emissiveIntensity={0.35} />
        </mesh>
        <StationScreen state={screen} width={w} height={h} playTrailer={playTrailer} occluders={occluders} />
      </group>
      {/* Switchboard beside the TV */}
      <mesh position={[w / 2 + 0.35, 1.05, 0.008]}>
        <boxGeometry args={[0.2, 0.12, 0.015]} />
        <meshStandardMaterial color="#f2f2f0" roughness={0.6} />
      </mesh>
      {/* Marble console table with its console */}
      <group position-z={TABLE.depth / 2 + 0.06}>
        <mesh position-y={TABLE.height / 2}>
          <boxGeometry args={[TABLE.width, TABLE.height, TABLE.depth]} />
          <meshStandardMaterial map={stone} roughness={0.25} />
        </mesh>
        <mesh position={[0, TABLE.height * 0.42, TABLE.depth / 2 + 0.001]}>
          <planeGeometry args={[TABLE.width * 0.86, TABLE.height * 0.32]} />
          <meshStandardMaterial color="#c9cbcc" roughness={0.6} />
        </mesh>
        <Console kind={station.console} />
      </group>
    </group>
  );
}

/** Station id → what its TV shows. Stations missing from the map are free. */
export type Screens = ReadonlyMap<number, ScreenState>;
const FREE: ScreenState = { busy: false };

/** Trailers play only on TVs this close (metres) that are on screen. */
const TRAILER_RANGE = 13;
const CHECK_SECONDS = 1;

/**
 * Picks which booked TVs play their trailer: the nearest ones on screen, at most `max`.
 * Rechecked once a second, so walking around hands the trailers over to the TVs in view.
 */
function useTrailerStations(screens: Screens, max: number): ReadonlySet<number> {
  const [playing, setPlaying] = useState<ReadonlySet<number>>(new Set());
  const last = useRef(-Infinity);
  const forward = useMemo(() => new Vector3(), []);
  const toTv = useMemo(() => new Vector3(), []);

  useFrame(({ camera, clock }) => {
    if (clock.elapsedTime - last.current < CHECK_SECONDS) return;
    last.current = clock.elapsedTime;
    camera.getWorldDirection(forward);
    const ranked = STATIONS.filter((s) => {
      const screen = screens.get(s.id);
      return screen?.busy && screen.game?.trailer;
    })
      .map((s) => {
        toTv.set(...s.position);
        const distance = toTv.distanceTo(camera.position);
        const ahead = forward.dot(toTv.clone().sub(camera.position)) > 0;
        // On screen: the TV's centre projects inside the view (with a small margin).
        toTv.project(camera);
        return { id: s.id, distance, onScreen: ahead && Math.abs(toTv.x) < 1.05 && Math.abs(toTv.y) < 1.05 };
      })
      .filter((t) => t.distance < TRAILER_RANGE && t.onScreen)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, max)
      .map((t) => t.id);
    setPlaying((current) =>
      current.size === ranked.length && ranked.every((id) => current.has(id)) ? current : new Set(ranked),
    );
  });
  return playing;
}

type StationsProps = {
  screens: Screens;
  /** Most trailers playing on TVs at once (each is a YouTube player). */
  maxTrailers: number;
  onSelect?: (station: Station) => void;
};

export function Stations({ screens, maxTrailers, onSelect }: StationsProps) {
  const playing = useTrailerStations(screens, maxTrailers);
  // Invisible stand-ins for the pillars: a trailer hides while one is between it and the camera.
  const occluders = useRef<Group>(null);
  return (
    <group>
      <group ref={occluders} visible={false}>
        {PILLARS.map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, ROOM.height / 2, z]}>
            <boxGeometry args={[0.45, ROOM.height, 0.45]} />
          </mesh>
        ))}
      </group>
      {STATIONS.map((s) => (
        <StationUnit
          key={s.id}
          station={s}
          screen={screens.get(s.id) ?? FREE}
          playTrailer={playing.has(s.id)}
          occluders={occluders}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
