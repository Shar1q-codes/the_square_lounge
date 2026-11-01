import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type LinkProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof Common> & { href: string };
type NativeButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Common> & { href?: undefined };

export type ButtonProps = LinkProps | NativeButtonProps;

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-wide " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-premium " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-gold text-bg hover:bg-gold-soft hover:shadow-[var(--shadow-glow-gold)]",
  secondary:
    "border border-border-strong bg-white/[0.03] text-fg backdrop-blur-md hover:border-gold/60 hover:text-gold-soft",
  ghost: "text-muted hover:text-fg",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

/** Renders an <a> when `href` is given, otherwise a <button type="button">. */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (typeof rest.href === "string") {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
