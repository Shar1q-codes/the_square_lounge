"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const LoungeCanvas = dynamic(() => import("./LoungeCanvas"), { ssr: false });

/** Client wrapper for the 3D lounge (controls, phone landscape and fallbacks arrive in later steps). */
export function LoungeViewer() {
  const mobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const view = useSearchParams().get("view") ?? undefined;
  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-[#0b0e10]">
      <LoungeCanvas mobile={mobile} motion={!reducedMotion} initialView={view} />
    </div>
  );
}
