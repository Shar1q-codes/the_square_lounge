import { ImageResponse } from "next/og";
import { logoDataUrl, MONOGRAM } from "@/components/brand/logoPaths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const HEIGHT = 136;

/** iOS home-screen icon: the gold TSL monogram on near-black. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 40%, #1a1610 0%, #07070a 70%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders plain <img> */}
        <img src={logoDataUrl(MONOGRAM)} height={HEIGHT} width={Math.round((HEIGHT * MONOGRAM.width) / MONOGRAM.height)} alt="" />
      </div>
    ),
    size,
  );
}
