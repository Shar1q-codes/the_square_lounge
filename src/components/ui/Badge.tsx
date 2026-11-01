import type { ConsoleType } from "@/config/site";
import { cn } from "@/lib/utils";

/** Console badge: PS5 = gold, PS4 = blue. Text only — no platform logos. */
export function ConsoleBadge({ console, className }: { console: ConsoleType; className?: string }) {
  const isPs5 = console === "PS5";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        isPs5 ? "border-gold/40 bg-gold/10 text-gold-soft" : "border-blue/40 bg-blue/10 text-blue",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-[2px]", isPs5 ? "bg-gold" : "bg-blue")}
      />
      {console}
    </span>
  );
}
