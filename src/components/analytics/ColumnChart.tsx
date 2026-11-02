"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type Column = { key: string; label: string; value: number; display: string };

type Props = { title: string; columns: Column[]; /** Show every nth x label so they don't collide. */ labelEvery?: number };

/**
 * Single-series column chart (one measure, one axis). Hover or tap a column for its value; the
 * readout line doubles as the live region for screen readers.
 */
export function ColumnChart({ title, columns, labelEvery = 1 }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...columns.map((c) => c.value), 0);
  const shown = active === null ? null : columns[active];
  const total = columns.reduce((s, c) => s + c.value, 0);

  return (
    <figure className="grid gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted tabular-nums" aria-live="polite">
          {shown ? `${shown.label}: ${shown.display}` : "Hover or tap a column"}
        </span>
      </figcaption>
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Nothing in this period.</p>
      ) : (
        <div className="grid gap-1">
          <div className="flex h-36 items-end gap-0.5 border-b border-border" onMouseLeave={() => setActive(null)}>
            {columns.map((c, i) => (
              <button
                key={c.key}
                type="button"
                aria-label={`${c.label}: ${c.display}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group flex h-full flex-1 items-end focus-visible:outline-offset-1"
              >
                <span
                  className={cn(
                    "block w-full rounded-t-[4px] bg-gold transition-opacity",
                    active !== null && active !== i && "opacity-40",
                    c.value === 0 && "bg-transparent",
                  )}
                  style={{ height: max ? `${Math.max((c.value / max) * 100, c.value > 0 ? 2 : 0)}%` : 0 }}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-0.5 text-[10px] text-muted" aria-hidden>
            {columns.map((c, i) => (
              <span key={c.key} className="flex-1 truncate text-center">
                {i % labelEvery === 0 ? c.label.split(" ")[0] : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
