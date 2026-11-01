import { display, site } from "@/config/site";
import { cn } from "@/lib/utils";
import { ConsoleBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScreenIcon, UsersIcon } from "@/components/ui/icons";
import { BookStationButton } from "./BookStationButton";

type Station = (typeof site.stations)[number];

/** Four corner brackets that light up into a glowing square frame on hover/focus. */
function FrameCorners({ ps5 }: { ps5: boolean }) {
  const corner =
    "absolute size-6 border-transparent transition-[border-color,filter] duration-500 ease-premium";
  const lit = ps5
    ? "group-hover:border-gold group-focus-within:border-gold group-hover:drop-shadow-[0_0_6px_rgb(212_178_106/0.8)]"
    : "group-hover:border-blue group-focus-within:border-blue group-hover:drop-shadow-[0_0_6px_rgb(59_130_246/0.8)]";
  return (
    <span aria-hidden className="pointer-events-none absolute inset-3">
      <span className={cn(corner, lit, "left-0 top-0 rounded-tl-lg border-l-2 border-t-2")} />
      <span className={cn(corner, lit, "right-0 top-0 rounded-tr-lg border-r-2 border-t-2")} />
      <span className={cn(corner, lit, "bottom-0 left-0 rounded-bl-lg border-b-2 border-l-2")} />
      <span className={cn(corner, lit, "bottom-0 right-0 rounded-br-lg border-b-2 border-r-2")} />
    </span>
  );
}

function StationCard({ station, className }: { station: Station; className?: string }) {
  const ps5 = station.console === "PS5";
  const number = String(station.id).padStart(2, "0");
  return (
    <Card
      as="article"
      aria-labelledby={`station-${station.id}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden p-7 transition-[border-color,box-shadow,transform] duration-500 ease-premium hover:-translate-y-1 lg:p-8",
        ps5
          ? "hover:border-gold/40 hover:shadow-[0_0_48px_rgb(212_178_106/0.12)]"
          : "hover:border-blue/40 hover:shadow-[0_0_48px_rgb(59_130_246/0.12)]",
        className,
      )}
    >
      <FrameCorners ps5={ps5} />
      {/* Soft glow that rises on hover */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100",
          ps5 ? "bg-gold/15" : "bg-blue/15",
        )}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Station</p>
          <h3 id={`station-${station.id}`} className="mt-1 font-display text-5xl font-semibold tracking-tight">
            <span className="sr-only">{station.name}, </span>
            <span aria-hidden>{number}</span>
          </h3>
        </div>
        <ConsoleBadge console={station.console} />
      </div>

      <dl className="relative mt-8 grid grid-cols-2 gap-4 border-y border-border py-5 text-sm">
        <div>
          <dt className="flex items-center gap-2 text-muted">
            <ScreenIcon className="size-4" /> Screen
          </dt>
          <dd className="mt-1 font-medium">{display(station.screen)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-muted">
            <UsersIcon className="size-4" /> Players
          </dt>
          <dd className="mt-1 font-medium">Up to {station.maxPlayers}</dd>
        </div>
      </dl>

      <ul className="relative mt-6 flex flex-1 flex-col gap-3 text-sm text-muted">
        {station.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3">
            <span aria-hidden className={cn("size-1.5 rotate-45 rounded-[1px]", ps5 ? "bg-gold" : "bg-blue")} />
            {feature}
          </li>
        ))}
      </ul>

      <div className="relative mt-8">
        <BookStationButton stationId={station.id} stationName={station.name} />
      </div>
    </Card>
  );
}

export function Stations() {
  const ps5 = site.stations.filter((s) => s.console === "PS5").length;
  const ps4 = site.stations.length - ps5;
  return (
    <Section id="stations">
      <Reveal>
        <SectionHeading
          sectionId="stations"
          eyebrow="The Setups"
          title={`${site.stations.length} private stations.`}
          description={`${ps5} PS5 and ${ps4} PS4 stations, each with its own big screen and premium seating.`}
        />
      </Reveal>
      <Reveal stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        {site.stations.map((station, i) => (
          <StationCard
            key={station.id}
            station={station}
            className={cn(
              // 3 across, then 2 wider cards on large screens; last card spans on tablets
              i < 3 ? "lg:col-span-2" : "lg:col-span-3",
              i === site.stations.length - 1 && site.stations.length % 2 === 1 && "md:col-span-2 lg:col-span-3",
            )}
          />
        ))}
      </Reveal>
    </Section>
  );
}
