import { display, site } from "@/config/site";
import { whatsappLink } from "@/lib/contact";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ChatIcon, CheckIcon } from "@/components/ui/icons";

export function Pricing() {
  const groupLink = whatsappLink(`Hi ${site.name}! I'd like to ask about a group or party booking.`);
  return (
    <Section id="pricing">
      <Reveal>
        <SectionHeading
          sectionId="pricing"
          eyebrow="Pricing"
          title="Simple, hourly pricing."
          description="No memberships, no hidden extras. Pay for the time you play, by screen and number of players."
          align="center"
        />
      </Reveal>

      <Reveal stagger className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {site.pricing.map((tier) => {
          const highlighted = "highlighted" in tier && tier.highlighted;
          return (
            <Card
              key={tier.id}
              as="article"
              aria-labelledby={`tier-${tier.id}`}
              className={cn(
                "flex flex-col p-7",
                highlighted &&
                  "border-gold/50 bg-linear-to-b from-gold/[0.08] to-surface/60 shadow-[0_0_60px_rgb(212_178_106/0.12)] lg:-my-3 lg:py-10",
              )}
            >
              {highlighted && (
                <p className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-bg">
                  Most popular
                </p>
              )}
              <h3 id={`tier-${tier.id}`} className="font-display text-lg font-semibold">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm text-muted">{tier.description}</p>
              {"rates" in tier && tier.rates ? (
                <dl className="mt-6 grid gap-2">
                  {tier.rates.map((rate) => (
                    <div key={rate.players} className="flex items-baseline justify-between gap-3">
                      <dt className="text-sm text-muted">{rate.players}</dt>
                      <dd className="flex items-baseline gap-1.5">
                        <span className={cn("font-display text-3xl font-semibold tracking-tight", highlighted && "text-gold-soft")}>
                          {display(rate.price)}
                        </span>
                        <span className="text-xs text-muted">{tier.unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-6 flex items-baseline gap-2">
                  <span className={cn("font-display text-4xl font-semibold tracking-tight", highlighted && "text-gold-soft")}>
                    {display(tier.price)}
                  </span>
                  {tier.unit && <span className="text-sm text-muted">{tier.unit}</span>}
                </p>
              )}
              <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-border pt-6 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-muted">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-gold" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button href="#booking" variant={highlighted ? "primary" : "secondary"} className="mt-8 w-full">
                {tier.id === "party" ? "Enquire" : "Book now"}
              </Button>
            </Card>
          );
        })}
      </Reveal>

      <Reveal className="mt-12">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-2xl border border-border bg-surface/40 px-6 py-5 text-center sm:flex-row sm:text-left">
          <span aria-hidden className="size-2.5 shrink-0 rotate-45 rounded-[2px] bg-gold shadow-[var(--shadow-glow-gold)]" />
          <p className="flex-1 text-sm text-muted">{site.pricingNote}</p>
          {groupLink && (
            <Button href={groupLink} size="sm" variant="ghost" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-soft">
              <ChatIcon className="size-4" /> Ask on WhatsApp
            </Button>
          )}
        </div>
      </Reveal>
    </Section>
  );
}
