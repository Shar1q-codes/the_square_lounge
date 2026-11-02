"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

// Not in TypeScript's DOM types yet. Chrome on Android/macOS/ChromeOS has it.
type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (options: { formats: string[] }) => Detector;
const getDetector = () => (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;

/** Camera QR scanning where the browser supports it; hidden otherwise (type or use a USB scanner). */
export function ScanButton({ onCode }: { onCode: (code: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => setSupported(!!getDetector() && !!navigator.mediaDevices?.getUserMedia), []);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;
    const Ctor = getDetector()!;
    const detector = new Ctor({ formats: ["qr_code"] });

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        stream = s;
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        timer = setInterval(async () => {
          if (!videoRef.current) return;
          const [hit] = await detector.detect(videoRef.current).catch(() => []);
          if (hit?.rawValue) {
            onCode(hit.rawValue);
            setScanning(false);
          }
        }, 300);
      })
      .catch(() => {
        setError("Camera not available. Type the code instead.");
        setScanning(false);
      });

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, onCode]);

  if (!supported) return null;
  return (
    <>
      <Button variant="secondary" onClick={() => { setError(undefined); setScanning(true); }}>
        Scan
      </Button>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {scanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg/95 p-4" role="dialog" aria-label="Scan member QR code">
          <video ref={videoRef} muted playsInline className="aspect-square w-full max-w-sm rounded-2xl border border-gold/40 object-cover" />
          <p className="text-sm text-muted">Point the camera at the member&apos;s QR code.</p>
          <Button variant="secondary" onClick={() => setScanning(false)}>
            Cancel
          </Button>
        </div>
      )}
    </>
  );
}
