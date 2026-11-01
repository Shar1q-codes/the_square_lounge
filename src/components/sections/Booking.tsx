import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BookingForm } from "./BookingForm";

export function Booking() {
  return (
    <Section id="booking" className="overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-96 max-w-3xl rounded-full bg-gold/10 blur-[120px]"
      />
      <Reveal>
        <SectionHeading
          sectionId="booking"
          eyebrow="Book"
          title="Reserve your station."
          description="Pick a station and a time. Your request opens in WhatsApp, ready to send, and we'll confirm availability there."
          align="center"
        />
      </Reveal>
      <Reveal className="mx-auto mt-14 max-w-3xl">
        <BookingForm />
      </Reveal>
    </Section>
  );
}
