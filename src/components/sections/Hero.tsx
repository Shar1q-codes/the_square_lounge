import { site } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/Reveal";
import { HeroVisual } from "./HeroVisual";

export function Hero() {
  const words = site.name.toUpperCase().split(" ");
  const last = words.pop();

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-svh items-center overflow-hidden"
    >
      <HeroVisual />
      {/* Soft shade behind the headline so it stays legible over the glowing scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[5] bg-[radial-gradient(ellipse_45%_32%_at_50%_48%,rgb(7_7_10/0.72),rgb(7_7_10/0.3)_60%,transparent)]"
      />

      <Container className="relative pb-20 pt-28 text-center">
        <Reveal stagger y={24} delay={0.15}>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">
            {site.address.locality} · {site.address.city}
          </p>
          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(2.75rem,10vw,8rem)] font-semibold leading-[0.9] tracking-[-0.035em]"
          >
            {words.join(" ")}
            <br />
            <span className="bg-linear-to-b from-gold-soft to-gold-deep bg-clip-text text-transparent">
              {last}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted sm:text-lg">{site.tagline}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button href="#booking" size="lg" className="w-full sm:w-auto">
              Book Now <ArrowRightIcon className="size-4" />
            </Button>
            <Button href="#stations" variant="secondary" size="lg" className="w-full sm:w-auto">
              Explore Setups
            </Button>
          </div>
        </Reveal>
      </Container>

      <div aria-hidden className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted">Scroll</span>
        <span className="h-10 w-px bg-linear-to-b from-gold/70 to-transparent" />
      </div>
    </section>
  );
}
