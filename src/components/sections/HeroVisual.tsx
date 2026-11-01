"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SquareLoader } from "@/components/three/SquareLoader";
import { HeroBackdrop } from "./HeroBackdrop";

const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), {
  ssr: false,
  loading: () => null, // SquareLoader below covers the whole load, chunk + fonts
});

let webglSupport: boolean | undefined;
function hasWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      webglSupport = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
const noopSubscribe = () => () => {};

/** Falls back to the CSS backdrop if WebGL throws (context lost, driver issues). */
class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The hero background: the 3D scene when possible, otherwise the static CSS square.
 * Owns the off-screen pause (IntersectionObserver) and the scroll progress for the camera.
 */
export function HeroVisual() {
  const reducedMotion = useReducedMotion();
  const mobile = useIsMobile();
  const webgl = useSyncExternalStore(noopSubscribe, hasWebGL, () => true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  const show3d = !reducedMotion && webgl && !failed;

  useEffect(() => {
    const el = ref.current;
    if (!el || !show3d) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [show3d]);

  useGSAP(
    () => {
      if (!show3d || !ref.current) return;
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
    },
    { dependencies: [show3d] },
  );

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {show3d ? (
        <>
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-[1400ms] ease-premium",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <CanvasBoundary onError={onError}>
              <HeroCanvas active={inView} progress={progress} mobile={mobile} onReady={onReady} />
            </CanvasBoundary>
          </div>
          <SquareLoader visible={!ready} />
        </>
      ) : (
        <HeroBackdrop />
      )}
      {/* Melt into the page below */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-b from-transparent to-bg" />
    </div>
  );
}
