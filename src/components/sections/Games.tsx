"use client";

import { useMemo, useState } from "react";
import { display, site, type GameCategory } from "@/config/site";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UsersIcon } from "@/components/ui/icons";

type Filter = "All" | GameCategory;

export function Games() {
  const [filter, setFilter] = useState<Filter>("All");
  const filters: Filter[] = ["All", ...site.gameCategories];

  const games = useMemo(
    () => (filter === "All" ? site.games : site.games.filter((g) => g.category === filter)),
    [filter],
  );

  return (
    <Section id="games">
      <Reveal className="flex flex-col gap-8">
        <SectionHeading
          sectionId="games"
          eyebrow="Library"
          title="Pick your game."
          description="Sports, racing, fighters and couch co-op, with new titles added regularly. Ask us at the lounge for the full list."
        />
        <div role="group" aria-label="Filter games by category" className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-10 rounded-full border px-4 text-sm transition-[background-color,border-color,color] duration-300 ease-premium",
                  active
                    ? "border-gold bg-gold text-bg"
                    : "border-border-strong text-muted hover:border-gold/50 hover:text-fg",
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Reveal>

      <p aria-live="polite" className="sr-only">
        Showing {games.length} {filter === "All" ? "" : filter} games
      </p>

      <Reveal className="mt-12">
        <ul key={filter} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game, i) => (
            <li
              key={game.title}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className="group relative animate-fade-up overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 transition-[border-color,box-shadow] duration-500 ease-premium hover:border-gold/40 hover:shadow-[0_0_32px_rgb(212_178_106/0.08)]"
            >
              <span
                aria-hidden
                className="absolute right-5 top-5 size-3 rotate-45 rounded-[2px] border border-gold/30 transition-[border-color,box-shadow] duration-500 group-hover:border-gold group-hover:shadow-[0_0_10px_rgb(212_178_106/0.7)]"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">{game.category}</p>
              <h3 className="mt-3 pr-6 font-display text-lg font-semibold leading-snug tracking-tight">
                {display(game.title)}
              </h3>
              <div className="mt-6 flex items-center justify-between text-xs text-muted">
                <span className="flex gap-1.5">
                  {game.consoles.map((c) => (
                    <span
                      key={c}
                      className={cn(
                        "rounded-md border px-2 py-0.5 font-medium tracking-wider",
                        c === "PS5" ? "border-gold/30 text-gold-soft" : "border-blue/30 text-blue",
                      )}
                    >
                      {c}
                    </span>
                  ))}
                </span>
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="size-3.5" />
                  <span className="sr-only">Players:</span> {game.players}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
