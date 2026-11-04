import { cafe, type MenuItem } from "@/config/menu";
import { rupees } from "@/lib/orders";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhoneIcon } from "@/components/ui/icons";

/** "₹70 / ₹100" with the size labels in small print. */
function Price({ item }: { item: MenuItem }) {
  return (
    <span className="shrink-0 whitespace-nowrap text-right">
      {item.options.map((o, i) => (
        <span key={o.id}>
          {i > 0 && <span className="px-1 text-muted">/</span>}
          {o.label && <span className="mr-1 text-[11px] uppercase tracking-wide text-muted">{o.label}</span>}
          <span className="font-medium text-gold-soft">{rupees(o.price)}</span>
        </span>
      ))}
    </span>
  );
}

/** The café menu on the homepage, with ordering from the stations. */
export function CafeMenu() {
  return (
    <Section id="cafe">
      <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          sectionId="cafe"
          eyebrow={cafe.name}
          title="Fuel for the next match."
          description="Fries, burgers, pizza, wraps and broasted chicken, made fresh in our café. Playing right now? Order from your phone and we'll bring it to your station."
        />
        <div className="flex flex-wrap gap-3">
          <Button href="/order">Order to my station</Button>
          <Button href={`tel:+91${cafe.orderPhone}`} variant="secondary">
            <PhoneIcon className="size-4" /> {cafe.orderPhone}
          </Button>
        </div>
      </Reveal>

      <Reveal stagger className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cafe.categories.map((category) => (
          <Card key={category.id} as="article" aria-labelledby={`menu-${category.id}`} className="p-6">
            <h3 id={`menu-${category.id}`} className="font-display text-lg font-semibold uppercase tracking-[0.14em] text-gold">
              {category.name}
            </h3>
            <ul className="mt-4 grid gap-2.5 text-sm">
              {category.items.map((item) => (
                <li key={item.id} className="flex items-baseline gap-2">
                  <span>
                    {item.name}
                    {item.note && <span className="text-muted"> · {item.note}</span>}
                  </span>
                  <span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-border-strong" />
                  <Price item={item} />
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </Reveal>

      <Reveal className="mt-8">
        <p className="text-center text-sm text-muted">
          Ordering from home? Call {cafe.orderPhone} or find us on {cafe.deliveryApps.join(" and ")}. Dine in or takeaway.
        </p>
      </Reveal>
    </Section>
  );
}
