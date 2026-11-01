import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Adds a soft gold glow around the mark */
  glow?: boolean;
  title?: string;
};

/** The Square Lounge logo mark — an outer frame holding a solid inner square. */
export function SquareMark({ className, glow = true, title }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn(
        "text-gold",
        glow && "drop-shadow-[0_0_6px_rgb(212_178_106/0.55)]",
        className,
      )}
    >
      {title && <title>{title}</title>}
      <rect x="3" y="3" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="11" y="11" width="10" height="10" rx="1.5" fill="currentColor" />
    </svg>
  );
}
