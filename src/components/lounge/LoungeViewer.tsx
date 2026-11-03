"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { VIEWPOINTS, type Station } from "@/config/lounge";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { stationCard } from "@/lib/lounge";
import { cn } from "@/lib/utils";
import { CloseIcon } from "@/components/ui/icons";
import { LandscapeShell } from "./LandscapeShell";

const LoungeCanvas = dynamic(() => import("./LoungeCanvas"), { ssr: false });

const TOUR_STEP_MS = 7000;

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
const isPortrait = () => window.innerHeight > window.innerWidth;

/** null until checked on the client. */
function useWebGL(): boolean | null {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setOk(Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/** Android Chrome can lock to landscape in full screen; iPhones can't, so the rotated view covers them. */
async function goLandscape() {
  try {
    await document.documentElement.requestFullscreen();
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape");
  } catch {
    // Not supported: the rotated view stays.
  }
}

/** The 3D lounge with its controls: viewpoints, guided tour, TV card, phone landscape and fallbacks. */
export function LoungeViewer() {
  const mobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const portrait = useSyncExternalStore(subscribeResize, isPortrait, () => false);
  // A phone held upright gets the sideways view; turning it for real needs nothing special.
  const rotated = mobile && portrait;
  const webgl = useWebGL();

  const requested = useSearchParams().get("view");
  const [view, setView] = useState(VIEWPOINTS.some((v) => v.id === requested) ? requested! : VIEWPOINTS[0].id);
  const [touring, setTouring] = useState(!requested);
  const [selected, setSelected] = useState<Station | null>(null);

  // Guided tour: step through the viewpoints until the visitor takes over (never with reduced motion).
  useEffect(() => {
    if (!touring || reducedMotion) return;
    const timer = setInterval(() => {
      setView((current) => VIEWPOINTS[(VIEWPOINTS.findIndex((v) => v.id === current) + 1) % VIEWPOINTS.length].id);
    }, TOUR_STEP_MS);
    return () => clearInterval(timer);
  }, [touring, reducedMotion]);

  const stopTour = useCallback(() => setTouring(false), []);
  const choose = (id: string) => {
    setTouring(false);
    setView(id);
  };

  if (webgl === false) return <PhotoFallback />;

  const card = selected && stationCard(selected);

  return (
    <LandscapeShell rotated={rotated} className="h-[calc(100dvh-4rem)] w-full bg-[#0b0e10] md:h-[calc(100dvh-5rem)]">
      {webgl && (
        <LoungeCanvas
          mobile={mobile}
          motion={!reducedMotion}
          view={view}
          rotated={rotated}
          onInteract={stopTour}
          onSelectStation={setSelected}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 md:p-5">
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-md">
          <h1 className="font-display text-base font-semibold uppercase tracking-[0.18em] md:text-lg">
            The <span className="text-gold">Lounge</span>
          </h1>
          <p className="mt-0.5 text-xs text-muted">
            {touring && !reducedMotion ? "Guided tour — drag to take over" : "Drag to look around · tap a TV"}
          </p>
        </div>
        {rotated && (
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              onClick={goLandscape}
              className="rounded-full border border-white/15 bg-black/50 px-3 py-2 text-xs backdrop-blur-md"
            >
              Full screen
            </button>
            <Link href="/" className="rounded-full border border-white/15 bg-black/50 px-3 py-2 text-xs backdrop-blur-md">
              Exit
            </Link>
          </div>
        )}
      </div>

      <nav
        aria-label="Viewpoints"
        className="absolute inset-x-0 bottom-0 flex justify-center p-3 md:p-5"
      >
        <ul className="flex max-w-full gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-black/55 p-1.5 backdrop-blur-md">
          {VIEWPOINTS.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                aria-pressed={view === v.id}
                onClick={() => choose(v.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors md:px-4 md:text-sm",
                  view === v.id ? "bg-gold text-bg" : "text-muted hover:text-fg",
                )}
              >
                {v.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {card && (
        <div
          role="dialog"
          aria-label={card.name}
          className="absolute right-3 top-24 w-60 rounded-2xl border border-gold/30 bg-black/70 p-4 backdrop-blur-md md:right-5 md:top-28"
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Close"
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full text-muted hover:text-fg"
          >
            <CloseIcon className="size-4" />
          </button>
          <p className="font-display text-lg font-semibold">{card.name}</p>
          <p className="mt-1 text-sm text-muted">
            {card.console} · {card.screen}
            {card.players && ` · ${card.players}`}
          </p>
          <Link
            href={card.bookHref}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg"
          >
            {card.bookLabel}
          </Link>
        </div>
      )}

      {rotated && (
        <p className="pointer-events-none absolute bottom-[4.5rem] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-3 py-1 text-[11px] text-muted">
          Turn your phone sideways for the best view
        </p>
      )}
    </LandscapeShell>
  );
}

/** Without WebGL: a plain description instead of the model. */
function PhotoFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl font-semibold">The Lounge</h1>
      <p className="text-muted">
        Your browser can&apos;t show the 3D model. The lounge has five PlayStation stations on big screens, sofas and
        bean bags, a café corner and colour-changing ceiling lights.
      </p>
      <Link href="/#booking" className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-bg">
        Book a station
      </Link>
    </div>
  );
}
