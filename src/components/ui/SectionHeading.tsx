import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Section id — the heading gets id `${sectionId}-title` */
  sectionId: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  sectionId,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: Props) {
  const centered = align === "center";
  return (
    <header className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      <p
        className={cn(
          "flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold",
          centered && "justify-center",
        )}
      >
        <span aria-hidden className="size-2 rounded-[2px] bg-gold shadow-[var(--shadow-glow-gold)]" />
        {eyebrow}
      </p>
      <h2
        id={`${sectionId}-title`}
        className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.02] tracking-[-0.02em] sm:text-5xl lg:text-6xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-pretty text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      )}
    </header>
  );
}
