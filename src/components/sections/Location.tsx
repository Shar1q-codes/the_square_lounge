import { site } from "@/config/site";
import { addressLines, telLink, whatsappLink } from "@/lib/contact";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ChatIcon, ClockIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { HoursTable } from "./HoursTable";

export function Location() {
  const call = telLink();
  const chat = whatsappLink(`Hi ${site.name}! I have a question.`);

  return (
    <Section id="location">
      <Reveal>
        <SectionHeading
          sectionId="location"
          eyebrow="Visit"
          title={`Find us in ${site.address.locality}.`}
          description="Walk in, or book ahead on WhatsApp to make sure your favourite station is free."
        />
      </Reveal>

      <Reveal className="mt-14 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="relative min-h-80 overflow-hidden p-0 lg:min-h-[28rem]">
          <iframe
            src={site.mapEmbedUrl}
            title={`Map showing ${site.name} in ${site.address.locality}, ${site.address.city}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            // Tints Google's light map to sit in the dark design
            className="absolute inset-0 size-full border-0 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.6)_brightness(0.95)]"
          />
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="p-7">
            <h3 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              <MapPinIcon className="size-4" /> Address
            </h3>
            <address className="mt-4 text-lg not-italic leading-relaxed">
              <span className="font-display font-semibold">{site.name}</span>
              {addressLines().map((line) => (
                <span key={line} className="block text-muted">
                  {line}
                </span>
              ))}
            </address>
            <a
              href={site.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex text-sm text-gold underline-offset-4 hover:underline"
            >
              Get directions →
            </a>
          </Card>

          <Card className="p-7">
            <h3 className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              <ClockIcon className="size-4" /> Opening hours
            </h3>
            <HoursTable />
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {call ? (
              <Button href={call} variant="secondary" size="lg">
                <PhoneIcon className="size-4" /> Call us
              </Button>
            ) : (
              <Button variant="secondary" size="lg" disabled>
                <PhoneIcon className="size-4" /> Phone coming soon
              </Button>
            )}
            {chat ? (
              <Button href={chat} size="lg" target="_blank" rel="noopener noreferrer">
                <ChatIcon className="size-4" /> WhatsApp
              </Button>
            ) : (
              <Button size="lg" disabled>
                <ChatIcon className="size-4" /> WhatsApp coming soon
              </Button>
            )}
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
