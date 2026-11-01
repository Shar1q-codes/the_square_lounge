import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: the square mark on near-black. */
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
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: 18,
            border: "8px solid #d4b26a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px rgba(212,178,106,0.45)",
          }}
        >
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "#d4b26a" }} />
        </div>
      </div>
    ),
    size,
  );
}
