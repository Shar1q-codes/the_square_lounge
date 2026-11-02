"use client";

import { useSyncExternalStore } from "react";
import { site, type OpeningHours } from "@/config/site";
import { isOpenAt, venueNow } from "@/lib/booking";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const hours = site.hours as readonly OpeningHours[];

const fmt = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${hhmm === "00:00" ? "midnight" : suffix}`.replace(
    "12 midnight",
    "Midnight",
  );
};

/** Which row is today, and whether we're open right now, in the venue's time zone. "" on the server. */
function snapshot(): string {
  const now = venueNow();
  const day = WEEKDAYS[new Date(`${now.date}T00:00:00Z`).getUTCDay()];
  const rowIndex = hours.findIndex((r) => r.schemaDays.includes(day));
  if (rowIndex < 0) return `-1|closed`;
  const time = `${String(Math.floor(now.minutes / 60)).padStart(2, "0")}:${String(now.minutes % 60).padStart(2, "0")}`;
  return `${rowIndex}|${isOpenAt(now.date, time) ? "open" : "closed"}`;
}

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(id);
};

export function HoursTable() {
  const state = useSyncExternalStore(subscribe, snapshot, () => "");
  const [todayIndex, status] = state ? state.split("|") : ["", ""];

  return (
    <div>
      {status && (
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium">
          <span
            aria-hidden
            className={cn(
              "size-2 rounded-full",
              status === "open" ? "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153/0.8)]" : "bg-muted",
            )}
          />
          {status === "open" ? "Open now" : "Closed now"}
        </p>
      )}
      <table className="w-full text-sm">
        <caption className="sr-only">Opening hours</caption>
        <tbody>
          {hours.map((row, i) => {
            const today = String(i) === todayIndex;
            return (
              <tr key={row.days} className={cn("border-b border-border last:border-0", today && "text-gold-soft")}>
                <th scope="row" className="py-3 text-left font-medium">
                  {row.days}
                  {today && <span className="ml-2 text-xs text-gold">Today</span>}
                </th>
                <td className="py-3 text-right text-muted">
                  <span className={cn(today && "text-fg")}>
                    {fmt(row.open)} – {fmt(row.close)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
