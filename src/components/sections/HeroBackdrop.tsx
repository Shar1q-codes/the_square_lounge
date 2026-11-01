/**
 * CSS-only glowing square. Used instead of the 3D scene for prefers-reduced-motion,
 * devices without WebGL, or if the canvas fails.
 */
export function HeroBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgb(212_178_106/0.14),transparent_55%),radial-gradient(ellipse_at_85%_85%,rgb(59_130_246/0.10),transparent_50%)]" />
      <div className="absolute left-1/2 top-[44%] size-[min(72vw,520px)] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[12%] border border-gold/30 shadow-[0_0_80px_rgb(212_178_106/0.18),inset_0_0_80px_rgb(212_178_106/0.08)]" />
      <div className="absolute left-1/2 top-[44%] size-[min(40vw,280px)] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[10%] border border-gold/15" />
    </div>
  );
}
