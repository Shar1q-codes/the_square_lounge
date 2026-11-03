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
