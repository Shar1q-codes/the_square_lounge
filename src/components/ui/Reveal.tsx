"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = ComponentPropsWithoutRef<"div"> & {
  /** Animate direct children one after another instead of the wrapper as a whole. */
  stagger?: boolean;
  /** Vertical travel in px. */
  y?: number;
  delay?: number;
};

/**
 * Fades and lifts content in as it scrolls into view (GSAP ScrollTrigger).
 * Content is fully visible in the server HTML, so it never hides without JS,
 * and nothing animates for prefers-reduced-motion.
 */
export function Reveal({ stagger = false, y = 28, delay = 0, children, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reducedMotion) return;
      const targets = stagger ? Array.from(el.children) : el;
      // Opacity only (not visibility), so content that hasn't scrolled into view yet
      // stays reachable with Tab; focusing inside finishes the animation at once.
      const tween = gsap.from(targets, {
        opacity: 0,
        y,
        duration: 1,
        delay,
        ease: "expo.out",
        stagger: stagger ? 0.09 : 0,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
      const reveal = () => tween.progress(1);
      el.addEventListener("focusin", reveal);
      return () => el.removeEventListener("focusin", reveal);
    },
    { scope: ref, dependencies: [reducedMotion, stagger, y, delay] },
  );

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  );
}
