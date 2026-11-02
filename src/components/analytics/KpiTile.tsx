import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  /** % change vs the previous period; null = no previous data. */
  change?: number | null;
  /** Some numbers are better when they go down (e.g. check-outs with no amount recorded). */
  lowerIsBetter?: boolean;
  note?: string;
};

/** Stat tile: label, value, and the change vs the previous period with a signed arrow (never colour alone). */
export function KpiTile({ label, value, change, lowerIsBetter = false, note }: Props) {
  const good = change !== undefined && change !== null && change !== 0 && (change > 0) !== lowerIsBetter;
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-1 text-xs tabular-nums",
            change === null || change === 0 ? "text-muted" : good ? "text-emerald-300" : "text-red-300",
          )}
        >
          {change === null ? "new vs previous" : change === 0 ? "no change" : `${change > 0 ? "▲ +" : "▼ "}${change}% vs previous`}
        </p>
      )}
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
