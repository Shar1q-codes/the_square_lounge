"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LenisContext = createContext<Lenis | null>(null);

/** Navbar height in px (h-16 / md:h-20); matches `scroll-padding-top` in globals.css. */
const NAV_OFFSET = 72;

/** The active Lenis instance, or null (SSR, before mount, or reduced motion). */
export function useLenis() {
  return useContext(LenisContext);
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis
 * share one clock. Disabled entirely for prefers-reduced-motion (native scroll).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const instance = new Lenis({
      autoRaf: false, // gsap.ticker drives raf below
      lerp: 0.1,
      // Smooth-scroll <a href="#id"> links, landing below the fixed navbar.
      anchors: { offset: -NAV_OFFSET },
    });

    instance.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => instance.raf(time * 1000); // gsap time is seconds
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33); // restore GSAP default
      instance.destroy();
      setLenis(null);
    };
  }, [reducedMotion]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
