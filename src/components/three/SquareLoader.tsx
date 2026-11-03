import { CONTROLLER_BURGER } from "@/components/brand/logoPaths";
import { cn } from "@/lib/utils";

/**
 * Shown while the 3D scene loads: the controller-and-burger logo drawing its own outline,
 * sized and placed where the 3D logo will appear, so one hands over to the other.
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
        viewBox={`0 0 ${CONTROLLER_BURGER.width} ${CONTROLLER_BURGER.height}`}
        fill="none"
        aria-hidden
        className="w-[min(64vw,460px)] -translate-y-[4%] overflow-visible drop-shadow-[0_0_14px_rgb(212_178_106/0.55)]"
      >
        <path
          d={CONTROLLER_BURGER.d}
          pathLength={1}
          stroke="var(--color-gold)"
          strokeWidth="6"
          className="square-draw"
        />
      </svg>
    </div>
  );
}
