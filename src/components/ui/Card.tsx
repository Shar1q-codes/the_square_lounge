import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

type CardProps<T extends ElementType> = {
  as?: T;
  /** Adds hover border glow */
  interactive?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** Glassmorphism surface with a hairline border and a top inner highlight. */
export function Card<T extends ElementType = "div">({
  as,
  interactive = false,
  className,
  ...rest
}: CardProps<T>) {
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cn(
        "relative rounded-2xl border border-border bg-surface/60 backdrop-blur-xl",
        "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]",
        interactive &&
          "transition-[border-color,box-shadow] duration-500 ease-premium hover:border-gold/40 hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),0_0_40px_rgb(212_178_106/0.08)]",
        className,
      )}
      {...rest}
    />
  );
}
