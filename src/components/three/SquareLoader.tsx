import { cn } from "@/lib/utils";

/**
 * Shown while the 3D scene loads: the square motif drawing its own outline,
 * sized and placed where the 3D frame will appear, so one hands over to the other.
 */
export function SquareLoader({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-premium",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgb(212_178_106/0.12),transparent_55%)]" />
      <svg
        viewBox="0 0 100 100"
        fill="none"
        className="size-[min(56vw,400px)] -translate-y-[4%] rotate-45 overflow-visible drop-shadow-[0_0_14px_rgb(212_178_106/0.55)]"
      >
        <rect
          x="2" y="2" width="96" height="96" rx="6"
          pathLength={1}
          stroke="var(--color-gold)"
          strokeWidth="0.8"
          className="square-draw"
        />
        <rect
          x="34" y="34" width="32" height="32" rx="3"
          pathLength={1}
          stroke="var(--color-gold)"
          strokeOpacity="0.6"
          strokeWidth="0.6"
          className="square-draw [animation-delay:0.35s]"
        />
      </svg>
    </div>
  );
}
