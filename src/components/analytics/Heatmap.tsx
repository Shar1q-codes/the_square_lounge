"use client";

import { useState } from "react";
import { HEATMAP_HOURS, heatLevel, hourLabel, WEEKDAY_LABELS } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Cell = { dow: number; hour: number; playing: number };

/** One gold hue, darker = fewer people. Level 0 sits on the surface. */
const LEVELS = ["bg-surface-2", "bg-[#4a3d22]", "bg-[#7a6232]", "bg-gold-deep", "bg-gold"] as const;
// Business week starting Monday reads more naturally for a venue.
const ROWS = [1, 2, 3, 4, 5, 6, 0];

export function Heatmap({ cells, quiet }: { cells: Cell[]; quiet: number[] }) {
  const [active, setActive] = useState<Cell | null>(null);
  const max = Math.max(...cells.map((c) => c.playing), 0);
  const at = (dow: number, hour: number) => cells.find((c) => c.dow === dow && c.hour === hour)?.playing ?? 0;

  return (
    <figure className="grid gap-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium">Average members playing, by night of the week and hour</span>
        <span className="text-xs text-muted tabular-nums" aria-live="polite">
          {active
            ? `${WEEKDAY_LABELS[active.dow]} ${hourLabel(active.hour)}: ${active.playing.toFixed(1)} playing`
            : "Hover or tap a square"}
        </span>
      </figcaption>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-separate border-spacing-[2px] text-[10px]" onMouseLeave={() => setActive(null)}>
          <thead>
            <tr>
              <th className="w-9" />
              {HEATMAP_HOURS.map((h) => (
                <th key={h} scope="col" className={cn("font-normal text-muted", quiet.includes(h) && "text-gold-soft")}>
                  {hourLabel(h).replace(" ", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((dow) => (
              <tr key={dow}>
                <th scope="row" className="pr-1 text-left font-normal text-muted">
                  {WEEKDAY_LABELS[dow]}
                </th>
                {HEATMAP_HOURS.map((hour) => {
                  const playing = at(dow, hour);
                  const cell = { dow, hour, playing };
                  return (
                    <td key={hour} className="p-0">
                      <button
                        type="button"
                        aria-label={`${WEEKDAY_LABELS[dow]} ${hourLabel(hour)}: ${playing.toFixed(1)} playing`}
                        onMouseEnter={() => setActive(cell)}
                        onFocus={() => setActive(cell)}
                        onClick={() => setActive(cell)}
                        className={cn("block h-6 w-full rounded-[3px]", LEVELS[heatLevel(playing, max)])}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5" aria-hidden>
          Fewer
          {LEVELS.map((l) => (
            <span key={l} className={cn("inline-block size-3 rounded-[3px]", l)} />
          ))}
          More (max {max.toFixed(1)})
        </span>
        {quiet.length > 0 && (
          <span>
            Quietest hours: <span className="text-gold-soft">{quiet.map(hourLabel).join(", ")}</span> (happy-hour candidates)
          </span>
        )}
      </div>
    </figure>
  );
}
