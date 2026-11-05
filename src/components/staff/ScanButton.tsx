"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "@/components/ui/Button";

// Not in TypeScript's DOM types yet. Chrome on Android/macOS/ChromeOS has it; elsewhere jsQR reads the frames.
type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (options: { formats: string[] }) => Detector;
const getDetector = () => (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;

/** Whether this device can scan with its camera (needs HTTPS and a camera API). */
export const canScan = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && window.isSecureContext;

/** Reads a QR code from a frame with jsQR, scaled down so it stays quick on older phones and PCs. */
async function jsqrReader() {
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  return (video: HTMLVideoElement): string | null => {
    if (!video.videoWidth) return null;
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

/**
 * Runs the camera into `videoRef` while `active` and calls `onCode` with the first QR code it reads.
 * Calls `onError` if the camera can't be opened (no camera, or permission refused).
 */
export function useQrCamera(
  videoRef: RefObject<HTMLVideoElement | null>,
  active: boolean,
  onCode: (code: string) => void,
  onError: (message: string) => void,
) {
  const handlers = useRef({ onCode, onError });
  handlers.current = { onCode, onError };

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch {
        handlers.current.onError("Camera not available. Allow camera access, or type the code instead.");
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      const Ctor = getDetector();
      const detector = Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
      const read = detector ? null : await jsqrReader();
      let busy = false;
      timer = setInterval(async () => {
        if (busy || stopped) return;
        busy = true;
        try {
          const code = detector ? (await detector.detect(video).catch(() => []))[0]?.rawValue : read!(video);
          if (code && !stopped) {
            stopped = true;
            handlers.current.onCode(code);
          }
        } finally {
          busy = false;
        }
      }, 250);
    })();

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, videoRef]);
}

/** The camera view with its frame, shown while scanning. */
export function ScanView({ videoRef, hint }: { videoRef: RefObject<HTMLVideoElement | null>; hint: string }) {
  return (
    <div className="grid justify-items-center gap-3">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-gold/40 bg-black">
        <video ref={videoRef} muted playsInline className="size-full object-cover" />
        <span aria-hidden className="absolute inset-[18%] rounded-xl border-2 border-gold/80 shadow-[0_0_0_999px_rgb(0_0_0/0.35)]" />
      </div>
      <p className="text-center text-sm text-muted">{hint}</p>
    </div>
  );
}

/** A "Scan" button that fills a field from a QR code. Hidden on devices without a usable camera. */
export function ScanButton({ onCode }: { onCode: (code: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => setSupported(canScan()), []);
  useQrCamera(
    videoRef,
    scanning,
    (code) => {
      onCode(code);
      setScanning(false);
    },
    (message) => {
      setError(message);
      setScanning(false);
    },
  );

  if (!supported) return null;
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setError(undefined);
          setScanning(true);
        }}
      >
        Scan
      </Button>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/95 p-4" role="dialog" aria-label="Scan QR code">
          <ScanView videoRef={videoRef} hint="Point the camera at the QR code." />
          <Button variant="secondary" onClick={() => setScanning(false)}>
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}
