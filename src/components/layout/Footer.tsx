import type { ReactNode } from "react";
import { site } from "@/config/site";
import { instagramLink, telLink, whatsappLink } from "@/lib/contact";
import { Container } from "@/components/ui/Container";
import { SquareMark } from "@/components/ui/SquareMark";
import { ChatIcon, InstagramIcon, PhoneIcon } from "@/components/ui/icons";

function ContactItem({ href, icon, label }: { href?: string; icon: ReactNode; label: string }) {
  const inner = (
    <>
      <span className="inline-flex size-9 items-center justify-center rounded-full border border-border text-gold transition-colors group-hover:border-gold/50">
        {icon}
      </span>
      {label}
    </>
  );
  if (!href) {
    // Placeholder value in site.ts — show it, but don't render a broken link.
    return <span className="flex items-center gap-3 text-sm text-muted/70">{inner}</span>;
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="group flex items-center gap-3 text-sm text-muted transition-colors hover:text-fg"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {inner}
    </a>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-border bg-surface/40">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-sm">
          <a href="#top" className="inline-flex items-center gap-3" aria-label={`${site.name} — back to top`}>
            <SquareMark className="size-9" />
            <span className="font-display text-base font-semibold uppercase tracking-[0.22em]">
              {site.name}
            </span>
          </a>
          <p className="mt-5 text-sm leading-relaxed text-muted">{site.description}</p>
          <p className="mt-4 text-sm text-muted">
            {site.address.locality}, {site.address.city}, {site.address.region}
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-fg">Explore</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-1">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-sm text-muted transition-colors hover:text-gold">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#booking" className="text-sm text-muted transition-colors hover:text-gold">
                Book a Station
              </a>
            </li>
            <li>
              <a href="/join" className="text-sm text-muted transition-colors hover:text-gold">
                Join rewards
              </a>
            </li>
            <li>
              <a href="/privacy" className="text-sm text-muted transition-colors hover:text-gold">
                Privacy
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-fg">Connect</h2>
          <ul className="mt-5 flex flex-col gap-3">
            <li>
              <ContactItem
                href={instagramLink()}
                icon={<InstagramIcon className="size-4" />}
                label={site.socials.instagramHandle}
              />
            </li>
            <li>
              <ContactItem href={whatsappLink()} icon={<ChatIcon className="size-4" />} label="WhatsApp" />
            </li>
            <li>
              <ContactItem href={telLink()} icon={<PhoneIcon className="size-4" />} label={site.contact.phone} />
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-6 text-xs text-muted/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>Independent venue. PS5 and PS4 are trademarks of their respective owners.</p>
        </Container>
      </div>
    </footer>
  );
}
