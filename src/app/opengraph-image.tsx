import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { logoDataUrl, MONOGRAM } from "@/components/brand/logoPaths";
import { site } from "@/config/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card, generated at build time: the gold TSL monogram beside the wordmark. */
export default async function OpengraphImage() {
  const ps5 = site.stations.filter((s) => s.console === "PS5").length;
  const ps4 = site.stations.length - ps5;
  const font = await readFile(join(process.cwd(), "public/fonts/SpaceGrotesk-SemiBold.woff"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 90px",
          gap: 80,
          backgroundColor: "#07070a",
          backgroundImage:
            "radial-gradient(ellipse at 22% 50%, rgba(212,178,106,0.22) 0%, rgba(7,7,10,0) 45%), radial-gradient(ellipse at 95% 100%, rgba(59,130,246,0.14) 0%, rgba(7,7,10,0) 45%)",
          fontFamily: "Space Grotesk",
          color: "#f5f5f7",
        }}
      >
        <div style={{ display: "flex", width: 300, height: 380, alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
          <img src={logoDataUrl(MONOGRAM)} width={280} height={Math.round((280 * MONOGRAM.height) / MONOGRAM.width)} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, letterSpacing: 8, color: "#d4b26a", textTransform: "uppercase" }}>
            {`${site.address.locality} · ${site.address.city}`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, lineHeight: 0.95, marginTop: 24, letterSpacing: -3 }}>
            <span>THE SQUARE</span>
            <span style={{ color: "#d4b26a" }}>LOUNGE</span>
          </div>
          <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 30 }}>{site.tagline}</div>
          <div style={{ fontSize: 24, color: "#f5f5f7", marginTop: 26, display: "flex", gap: 18 }}>
            <span>{`${ps5} × PS5`}</span>
            <span style={{ color: "#3f3f46" }}>/</span>
            <span>{`${ps4} × PS4`}</span>
            <span style={{ color: "#3f3f46" }}>/</span>
            <span>Big screens</span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Space Grotesk", data: font, weight: 600, style: "normal" }] },
  );
}
