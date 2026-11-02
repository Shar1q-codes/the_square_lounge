import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SquareMark } from "@/components/ui/SquareMark";

type Props = { children: ReactNode; nav?: ReactNode; wide?: boolean };

/** Plain header + centred column for account pages (no 3D hero, light on phones). */
export function AccountShell({ children, nav, wide = false }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-bg/70 backdrop-blur-xl">
        {/* Wraps the nav onto a second row on narrow phones (the staff nav has five links). */}
        <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${site.name} home`}>
            <SquareMark className="size-7" />
            <span className="font-display text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm">
              The Square<span className="text-gold"> Lounge</span>
            </span>
          </Link>
          {nav && <nav className="-mx-3 flex flex-wrap items-center gap-x-1 text-sm sm:mx-0">{nav}</nav>}
        </Container>
      </header>
      <main id="main" className="flex-1 py-10 sm:py-16">
        <Container className={wide ? "max-w-6xl" : "max-w-2xl"}>{children}</Container>
      </main>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gold">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-3 text-muted">{children}</div>}
    </div>
  );
}
