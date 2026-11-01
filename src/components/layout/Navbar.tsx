"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SquareMark } from "@/components/ui/SquareMark";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { useLenis } from "./SmoothScroll";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Navbar() {
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Glassy bar once the page has scrolled a little (Lenis scrolls the window natively).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Side effects run synchronously so Lenis is running again before an anchor click is handled.
  const setMenu = useCallback(
    (next: boolean) => {
      setOpen(next);
      document.documentElement.style.overflow = next ? "hidden" : "";
      if (next) lenis?.stop();
      else lenis?.start();
    },
    [lenis],
  );

  // Close if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mql.matches && setMenu(false);
    mql.addEventListener("change", onChange);
    firstLinkRef.current?.focus();
    return () => mql.removeEventListener("change", onChange);
  }, [open, setMenu]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (e.key === "Escape") {
      setMenu(false);
      toggleRef.current?.focus();
      return;
    }
    if (e.key !== "Tab" || !rootRef.current) return;
    // Focus trap across the header (toggle) + open menu panel.
    const items = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const solid = scrolled || open;

  return (
    <div ref={rootRef} onKeyDown={onKeyDown}>
      <a
        href="#main"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-full bg-gold px-4 py-2 text-sm font-medium text-bg transition-transform focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-premium",
          solid ? "border-border bg-bg/70 backdrop-blur-xl" : "border-transparent bg-transparent",
        )}
      >
        <Container className="flex h-16 items-center justify-between gap-6 md:h-20">
          <a href="#top" className="flex items-center gap-3" aria-label={`${site.name} — back to top`}>
            <SquareMark className="size-8" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.22em]">
              The Square<span className="text-gold"> Lounge</span>
            </span>
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-muted transition-colors duration-300 hover:text-fg"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button href="#booking" size="sm" className="hidden sm:inline-flex">
              Book a Station
            </Button>
            <button
              ref={toggleRef}
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border text-fg transition-colors hover:border-gold/50 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setMenu(!open)}
            >
              {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </Container>
      </header>

      {/* Sibling of <header>: its backdrop-filter would otherwise trap this fixed panel. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto overscroll-contain bg-bg/95 backdrop-blur-xl md:top-20 lg:hidden",
          "transition-[opacity,visibility] duration-500 ease-premium",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <Container className="flex min-h-full flex-col justify-between gap-10 py-10">
          <nav aria-label="Mobile">
            <ul className="flex flex-col">
              {site.nav.map((item, i) => (
                <li key={item.href} className="border-b border-border">
                  <a
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    onClick={() => setMenu(false)}
                    className="flex items-baseline gap-4 py-5 font-display text-3xl font-semibold tracking-tight transition-colors hover:text-gold"
                  >
                    <span className="text-xs font-medium tracking-[0.2em] text-gold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button href="#booking" size="lg" onClick={() => setMenu(false)} className="w-full">
            Book a Station
          </Button>
        </Container>
      </div>
    </div>
  );
}
