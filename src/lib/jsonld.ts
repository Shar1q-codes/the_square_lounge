import { isPlaceholder, site, type OpeningHours } from "@/config/site";
import { instagramLink } from "@/lib/contact";

const real = (value: string) => (isPlaceholder(value) ? undefined : value);

/**
 * schema.org EntertainmentBusiness (a LocalBusiness subtype), built from site.ts.
 * Placeholder ("TODO:") values are left out rather than published.
 */
export function localBusinessJsonLd() {
  const { address, contact, geo } = site;
  const sameAs = [instagramLink()].filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "@id": `${site.url}/#business`,
    name: site.name,
    description: site.description,
    slogan: site.tagline,
    url: site.url,
    image: `${site.url}/opengraph-image`,
    logo: `${site.url}/icon.svg`,
    telephone: real(contact.phoneHref),
    email: real(contact.email),
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: real(address.street),
      addressLocality: `${address.locality}, ${address.city}`,
      addressRegion: address.region,
      postalCode: real(address.postalCode),
      addressCountry: address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: geo.latitude, longitude: geo.longitude },
    hasMap: real(site.mapLink),
    openingHoursSpecification: (site.hours as readonly OpeningHours[]).map((row) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: row.schemaDays,
      opens: row.open,
      closes: row.close,
    })),
    sameAs: sameAs.length ? sameAs : undefined,
    amenityFeature: site.stations.map((s) => ({
      "@type": "LocationFeatureSpecification",
      name: `${s.name} (${s.console})`,
      value: true,
    })),
  };

  // Drop undefined keys so the output stays clean.
  return JSON.parse(JSON.stringify(data));
}

/** Serialise for a <script type="application/ld+json">, escaping "<" so content can't close the tag. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
