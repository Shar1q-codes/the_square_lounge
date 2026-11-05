import { useId } from "react";
import { loyalty } from "@/config/loyalty";
import { cn } from "@/lib/utils";

/** The Lounge Points coin: a gold coin with "LP" stamped in the middle. Decorative; say the name in text. */
export function LpCoin({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("inline-block size-[1.3em] shrink-0 align-[-0.28em]", className)}>
      <defs>
        <radialGradient id={`${id}-face`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fbe7ad" />
          <stop offset="0.55" stopColor="#d9b565" />
          <stop offset="1" stopColor="#a07a2e" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d68b" />
          <stop offset="1" stopColor="#7d5c1e" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill={`url(#${id}-rim)`} />
      <circle cx="16" cy="16" r="12.6" fill={`url(#${id}-face)`} />
      <circle cx="16" cy="16" r="10.9" fill="none" stroke="#8a6624" strokeOpacity="0.55" strokeWidth="0.8" />
      {/* "LP" drawn as strokes, not text, so copied amounts don't read "LP100". */}
      <path
        d="M9.6 10.6V21.4H14.6M17.6 21.4V10.6H20.6A2.95 2.95 0 0 1 20.6 16.5H17.6"
        fill="none"
        stroke="#4a3410"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  value: number;
  /** Show "Lounge Points" after the number (default) or just the coin and number. */
  label?: boolean;
  /** "+20" / "−20" for history lines. */
  signed?: boolean;
  className?: string;
  coinClassName?: string;
};

/** An amount of Lounge Points: coin, number and (by default) the name. */
export function LoungePoints({ value, label = true, signed = false, className, coinClassName }: Props) {
  const sign = signed ? (value > 0 ? "+" : value < 0 ? "−" : "") : value < 0 ? "−" : "";
  return (
    <span className={cn("whitespace-nowrap", className)}>
      <LpCoin className={cn("mr-[0.3em]", coinClassName)} />
      <span className="tabular-nums">
        {sign}
        {Math.abs(value).toLocaleString("en-IN")}
      </span>
      {label && <span className="font-normal"> {loyalty.pointsName}</span>}
    </span>
  );
}
