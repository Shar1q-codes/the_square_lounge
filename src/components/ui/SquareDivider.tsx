import { cn } from "@/lib/utils";

/** Hairline divider with the glowing square motif at its centre. */
export function SquareDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8", className)}>
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-gold/30" />
      <span className="mx-5 size-2.5 rotate-45 rounded-[2px] border border-gold/70 shadow-[0_0_12px_rgb(212_178_106/0.5)]" />
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-gold/30" />
    </div>
  );
}
