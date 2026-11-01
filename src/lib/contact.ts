import { isPlaceholder, site } from "@/config/site";

/** wa.me link, or undefined while the WhatsApp number is still a placeholder. */
export function whatsappLink(text?: string): string | undefined {
  const raw: string = site.contact.whatsapp;
  if (isPlaceholder(raw)) return undefined;
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** tel: link, or undefined while the phone number is still a placeholder. */
export function telLink(): string | undefined {
  const raw: string = site.contact.phoneHref;
  if (isPlaceholder(raw)) return undefined;
  return `tel:${raw.replace(/[^\d+]/g, "")}`;
}

export function instagramLink(): string | undefined {
  const raw: string = site.socials.instagram;
  return isPlaceholder(raw) ? undefined : raw;
}

/** Display lines of the address, leaving out any "TODO:" placeholders. */
export function addressLines(): string[] {
  const a = site.address;
  const join = (parts: string[], sep: string) => parts.filter((v) => !isPlaceholder(v)).join(sep);
  return [
    isPlaceholder(a.street) ? "" : a.street,
    join([a.locality, a.city], ", "),
    join([a.region, a.postalCode], " "),
  ].filter(Boolean);
}
