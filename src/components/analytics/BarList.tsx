export type BarRow = { label: string; value: number; display: string; detail?: string };

/** Horizontal single-series bars with the value written beside each (no legend needed). */
export function BarList({ rows, empty = "Nothing in this period." }: { rows: BarRow[]; empty?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  if (rows.length === 0 || max === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="grid gap-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              <span className="text-fg">{r.display}</span>
              {r.detail ? ` · ${r.detail}` : ""}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2" aria-hidden>
            <div className="h-full rounded-full bg-gold" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
