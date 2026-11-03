import { useId } from "react";
import { cn } from "@/lib/utils";
import { CONTROLLER_BURGER, GRADIENTS, MONOGRAM, type LogoPath, type Tone } from "./logoPaths";

type Props = {
  /** Set the height (e.g. "h-9"); the width follows the logo's proportions. */
  className?: string;
  tone?: Tone;
  /** Soft gold glow behind the mark (for dark backgrounds). */
  glow?: boolean;
  /** Accessible name. Without it the mark is decorative (aria-hidden). */
  title?: string;
};

function Mark({ logo, className, tone = "gold", glow = false, title }: Props & { logo: LogoPath }) {
  const id = useId().replace(/:/g, "");
  const [a, b, c] = GRADIENTS[tone];
  return (
    <svg
      viewBox={`0 0 ${logo.width} ${logo.height}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      className={cn("w-auto shrink-0", glow && "drop-shadow-[0_0_6px_rgb(212_178_106/0.5)]", className)}
    >
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset=".5" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </linearGradient>
      </defs>
      <path fill={`url(#g${id})`} fillRule="evenodd" d={logo.d} />
    </svg>
  );
}

/** The interlaced TSL monogram: the site's main mark (navbar, footer, headers, icons). */
export const TslMonogram = (props: Props) => <Mark logo={MONOGRAM} {...props} />;

/** The controller-and-burger mark: gaming + café. */
export const ControllerBurgerLogo = (props: Props) => <Mark logo={CONTROLLER_BURGER} {...props} />;
