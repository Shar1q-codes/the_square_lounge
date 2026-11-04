"use client";

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";

/** Draws a texture on a canvas once; repeated across a surface by `repeat`. */
function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeat: [number, number]) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 8;
  return texture;
}

/** 60 cm glossy white floor tiles with thin grout lines and a faint marble cloud. */
export function floorTiles(length: number, width: number, colour: string, grout: string) {
  return canvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(190,196,196,${0.04 + Math.random() * 0.05})`;
        ctx.beginPath();
        ctx.ellipse(Math.random() * s, Math.random() * s, 20 + Math.random() * 80, 6 + Math.random() * 20, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = grout;
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, s - 3, s - 3);
    },
    [length / 0.6, width / 0.6],
  );
}

/** The raised centre panel's square grid (it reads as a coffered pattern in the photos). */
export function ceilingGrid(width: number, depth: number) {
  return canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = "#e8ebee";
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#c9ced3";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, s - 6, s - 6);
      ctx.strokeStyle = "#d9dde1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s, s);
      ctx.moveTo(s, 0);
      ctx.lineTo(0, s);
      ctx.stroke();
    },
    [width / 0.6, depth / 0.6],
  );
}

/** White marble with soft grey veins, for the console tables. */
export function marble() {
  return canvasTexture(
    512,
    (ctx, s) => {
      ctx.fillStyle = "#f3f3f1";
      ctx.fillRect(0, 0, s, s);
      ctx.lineCap = "round";
      for (let v = 0; v < 7; v++) {
        ctx.strokeStyle = `rgba(120,124,128,${0.15 + Math.random() * 0.25})`;
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        let x = Math.random() * s;
        let y = 0;
        ctx.moveTo(x, y);
        while (y < s) {
          x += (Math.random() - 0.5) * 60;
          y += 20 + Math.random() * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    [1, 1],
  );
}

/** Diamond-quilted upholstery, like the sofa backs in the photos. */
export function quilted(colour: string, repeat: [number, number]) {
  return canvasTexture(
    256,
    (ctx, s) => {
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(0,0,0,0.28)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, s / 2);
      ctx.lineTo(s / 2, 0);
      ctx.lineTo(s, s / 2);
      ctx.lineTo(s / 2, s);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, s / 2 + 2);
      ctx.lineTo(s / 2 + 2, 2);
      ctx.stroke();
    },
    repeat,
  );
}

/** Vertical pleats for the maroon curtains (shading only; the folds are also in the geometry). */
export function pleats(colour: string, folds: number) {
  return canvasTexture(
    256,
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s, 0);
      g.addColorStop(0, "rgba(0,0,0,0.35)");
      g.addColorStop(0.5, "rgba(255,255,255,0.06)");
      g.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
    },
    [folds, 1],
  );
}

type PosterStyle = { from: string; to: string; accent: string; motif: "wave" | "burst" | "grid" | "rings" | "bolt" };

/**
 * Stylised poster art in the colours of the real posters. Not copies of the game/football artwork,
 * which belongs to its owners (see SPEC-lounge-3d.md, assumption 3).
 */
export function posterArt({ from, to, accent, motif }: PosterStyle, seed: number) {
  let r = seed;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  return canvasTexture(
    256,
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, s * 0.3, s);
      g.addColorStop(0, from);
      g.addColorStop(1, to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = accent;
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      if (motif === "wave") {
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          for (let x = 0; x <= s; x += 8) ctx.lineTo(x, s * 0.55 + i * 18 + Math.sin(x / 30 + i) * 14);
          ctx.stroke();
        }
      } else if (motif === "burst") {
        for (let i = 0; i < 14; i++) {
          const a = rand() * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(s / 2, s * 0.45);
          ctx.lineTo(s / 2 + Math.cos(a) * s, s * 0.45 + Math.sin(a) * s);
          ctx.stroke();
        }
      } else if (motif === "grid") {
        for (let i = 0; i < 9; i++) {
          ctx.beginPath();
          ctx.moveTo(s / 2, s * 0.4);
          ctx.lineTo((i / 8) * s * 2 - s / 2, s);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(s / 2, s * 0.32, s * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else if (motif === "rings") {
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(s * 0.5, s * 0.45, i * 22, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(s * 0.55, s * 0.08);
        ctx.lineTo(s * 0.35, s * 0.52);
        ctx.lineTo(s * 0.52, s * 0.52);
        ctx.lineTo(s * 0.4, s * 0.92);
        ctx.lineTo(s * 0.7, s * 0.4);
        ctx.lineTo(s * 0.52, s * 0.4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, s * 0.82, s, s * 0.18);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(s * 0.12, s * 0.88, s * (0.35 + rand() * 0.35), 7);
    },
    [1, 1],
  );
}

/** The standing banner: the lounge's own branding (TSL monogram + "EAT. PLAY. DOMINATE."). */
export function bannerArt(monogramPath: string, monogramSize: [number, number]) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 768);
  g.addColorStop(0, "#0d0d12");
  g.addColorStop(0.55, "#1b1420");
  g.addColorStop(1, "#08080b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 768);
  // Monogram
  const scale = 70 / monogramSize[1];
  ctx.save();
  ctx.translate(128 - (monogramSize[0] * scale) / 2, 28);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#d4b26a";
  ctx.fill(new Path2D(monogramPath), "evenodd");
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "#f5f5f7";
  ctx.font = "bold 46px 'Space Grotesk', Arial, sans-serif";
  ctx.fillText("EAT.", 128, 170);
  ctx.fillStyle = "#e6c34a";
  ctx.fillText("PLAY.", 128, 220);
  ctx.fillStyle = "#f5f5f7";
  ctx.fillText("DOMINATE.", 128, 270);
  // Neon tiles standing in for the game and food artwork
  const tiles = ["#3b82f6", "#ff3fbf", "#20e3c2", "#ff9a3c", "#8a3cff", "#e6c34a"];
  tiles.forEach((c, i) => {
    const x = 22 + (i % 3) * 74;
    const y = 300 + Math.floor(i / 3) * 110;
    const tg = ctx.createLinearGradient(x, y, x + 64, y + 96);
    tg.addColorStop(0, c);
    tg.addColorStop(1, "#111");
    ctx.fillStyle = tg;
    ctx.fillRect(x, y, 64, 96);
  });
  ctx.fillStyle = "#d4b26a";
  ctx.font = "bold 26px 'Space Grotesk', Arial, sans-serif";
  ctx.fillText("LEVEL UP YOUR FUN", 128, 600);
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("PLAY · EAT · CHILL · REPEAT", 128, 632);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** What you see through the glass entrance door: the lit stairwell. */
export function stairwell() {
  return canvasTexture(
    256,
    (ctx, s) => {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#c9b59a");
      g.addColorStop(1, "#6d5a46");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 9; i++) {
        const y = s * 0.45 + i * 16;
        ctx.fillStyle = i % 2 ? "#7b2a2a" : "#9b8466";
        ctx.fillRect(s * 0.15 + i * 6, y, s * 0.7 - i * 12, 10);
      }
      ctx.fillStyle = "rgba(255,240,210,0.6)";
      ctx.fillRect(s * 0.4, 6, s * 0.2, 10);
    },
    [1, 1],
  );
}
