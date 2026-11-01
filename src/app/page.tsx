import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PlaceholderNotice } from "@/components/layout/PlaceholderNotice";
import { Booking } from "@/components/sections/Booking";
import { Experience } from "@/components/sections/Experience";
import { Gallery } from "@/components/sections/Gallery";
import { Games } from "@/components/sections/Games";
import { Hero } from "@/components/sections/Hero";
import { Location } from "@/components/sections/Location";
import { Pricing } from "@/components/sections/Pricing";
import { Stations } from "@/components/sections/Stations";
import { SquareDivider } from "@/components/ui/SquareDivider";
import { jsonLdString, localBusinessJsonLd } from "@/lib/jsonld";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(localBusinessJsonLd()) }}
      />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <Stations />
        <SquareDivider />
        <Experience />
        <SquareDivider />
        <Games />
        <SquareDivider />
        <Pricing />
        <SquareDivider />
        <Gallery />
        <SquareDivider />
        <Location />
        <SquareDivider />
        <Booking />
      </main>
      <Footer />
      {process.env.NODE_ENV === "development" && <PlaceholderNotice />}
    </>
  );
}
