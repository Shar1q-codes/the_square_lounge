"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CanvasTexture, SRGBColorSpace, VideoTexture, type Object3D, type MeshBasicMaterial } from "three";
import type { Game } from "@/config/site";

/** What a station's TV shows: nothing (free), or the game being played there. */
export type ScreenState = { busy: false } | { busy: true; game: Game | null };

/** A 16:9 card with the game's title, for games without a clip (or while the clip loads). */
function titleCard(title: string | null): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext("2d")!;
  const bg = ctx.createLinearGradient(0, 0, 1024, 576);
  bg.addColorStop(0, "#0d1530");
  bg.addColorStop(0.55, "#1b1036");
  bg.addColorStop(1, "#071a24");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 576);
  // Faint diagonal light streaks, like a game's menu screen.
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#7fd8ff";
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 220 - 200, 576);
    ctx.lineTo(i * 220 - 120, 576);
    ctx.lineTo(i * 220 + 160, 0);
    ctx.lineTo(i * 220 + 80, 0);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const font = getComputedStyle(document.body).getPropertyValue("--font-display").trim() || "system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#d4b26a";
  ctx.font = `600 34px ${font}`;
  ctx.fillText(title ? "NOW PLAYING" : "IN USE", 512, title ? 230 : 300);
  if (title) {
    ctx.fillStyle = "#ffffff";
    let size = 84;
    do {
      ctx.font = `700 ${size}px ${font}`;
      size -= 4;
    } while (ctx.measureText(title).width > 900 && size > 36);
    ctx.fillText(title, 512, 330);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A muted, looping clip as a texture; null until the first frame is ready or if it can't play. */
function useClip(src: string | undefined): VideoTexture | null {
  const [texture, setTexture] = useState<VideoTexture | null>(null);
  useEffect(() => {
    if (!src) return;
    const video = document.createElement("video");
    Object.assign(video, { src, muted: true, loop: true, playsInline: true, preload: "auto", crossOrigin: "anonymous" });
    video.setAttribute("playsinline", "");
    const tex = new VideoTexture(video);
    tex.colorSpace = SRGBColorSpace;
    const ready = () => setTexture(tex);
    video.addEventListener("loadeddata", ready, { once: true });
    video.play().catch(() => {
      // Autoplay refused (rare for muted video) or the file is missing: the title card stays.
    });
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      tex.dispose();
      setTexture(null);
    };
  }, [src]);
  return texture;
}

/** The embedded player is laid out at this size in CSS pixels, then scaled down to the screen. */
const PLAYER = { width: 640, height: 360 };

/**
 * The game's official YouTube trailer laid over the TV screen in 3D (YouTube's own embedded player,
 * placed with CSS transforms; a video from another site can't be drawn into WebGL). Muted and looping,
 * it lets drags and taps through to the 3D view, and hides while a pillar is in front of it.
 */
type TrailerProps = { videoId: string; title: string; width: number; occluders: RefObject<Object3D | null> };

function TrailerOnScreen({ videoId, title, width, occluders }: TrailerProps) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    controls: "0",
    disablekb: "1",
    rel: "0",
    modestbranding: "1",
    iv_load_policy: "3",
  });
  return (
    <Html
      transform
      position-z={0.03}
      // In transform mode one CSS pixel is distanceFactor / 400 metres: this fits 640 px to the screen.
      distanceFactor={(width / PLAYER.width) * 400}
      occlude={[occluders as RefObject<Object3D>]}
      pointerEvents="none"
      // Stays under the page's own panels (viewpoints, TV card), which come later in the page.
      zIndexRange={[0, 0]}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
        title={`${title} official trailer`}
        allow="autoplay; encrypted-media"
        tabIndex={-1}
        style={{ width: PLAYER.width, height: PLAYER.height, border: 0, display: "block", pointerEvents: "none" }}
      />
    </Html>
  );
}

type ScreenProps = {
  state: ScreenState;
  width: number;
  height: number;
  /** Play the game's trailer on the screen (only the nearest few booked TVs do, to keep phones smooth). */
  playTrailer: boolean;
  /** Things that can stand between the camera and a TV (the pillars), for hiding the trailer. */
  occluders: RefObject<Object3D | null>;
};

/** The picture on a booked TV. Free TVs keep the dark glass screen drawn by StationUnit. */
export function StationScreen({ state, width, height, playTrailer, occluders }: ScreenProps) {
  const game = state.busy ? state.game : null;
  const card = useMemo(() => (state.busy ? titleCard(game?.title ?? null) : null), [state.busy, game?.title]);
  useEffect(() => () => card?.dispose(), [card]);
  const clip = useClip(state.busy ? game?.clip : undefined);
  const material = useRef<MeshBasicMaterial>(null);

  // The title card breathes gently so the screen reads as switched on.
  useFrame(({ clock }) => {
    if (!material.current || clip) return;
    const k = 0.8 + Math.sin(clock.elapsedTime * 1.6) * 0.08;
    material.current.color.setScalar(k);
  });

  if (!state.busy || !card) return null;
  const trailer = playTrailer && !clip ? game?.trailer : undefined;
  return (
    <>
      <mesh position-z={0.027}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={material} map={clip ?? card} toneMapped={false} />
      </mesh>
      {trailer && game && <TrailerOnScreen videoId={trailer} title={game.title} width={width} occluders={occluders} />}
    </>
  );
}
