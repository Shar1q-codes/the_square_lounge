import type { ComponentType, SVGProps } from "react";
import { site, type ExperienceIcon } from "@/config/site";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LibraryIcon, MoonIcon, ScreenIcon, SeatIcon } from "@/components/ui/icons";

const ICONS: Record<ExperienceIcon, ComponentType<SVGProps<SVGSVGElement>>> = {
  seat: SeatIcon,
  screen: ScreenIcon,
  library: LibraryIcon,
  ambience: MoonIcon,
};

export function Experience() {
  return (
    <Section id="experience" className="overflow-hidden">
      {/* Faint oversized square behind the section */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[10%] border border-gold/[0.07]"
      />
      <Reveal>
        <SectionHeading
          sectionId="experience"
          eyebrow="Why The Square"
          title="Built for long nights and big wins."
          description="Everything about the lounge is tuned for comfort and immersion, so the only thing you think about is the next match."
          align="center"
        />
      </Reveal>
      <Reveal stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {site.experience.map((feature, i) => {
          const Icon = ICONS[feature.icon];
          return (
            <Card key={feature.title} interactive className="group p-7">
              <div className="flex items-center justify-between">
                <span className="relative inline-flex size-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/5 text-gold transition-[border-color,box-shadow] duration-500 group-hover:border-gold/70 group-hover:shadow-[var(--shadow-glow-gold)]">
                  <Icon className="size-6" />
                </span>
                <span aria-hidden className="font-display text-sm text-muted/50">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{feature.description}</p>
            </Card>
          );
        })}
      </Reveal>
    </Section>
  );
}
