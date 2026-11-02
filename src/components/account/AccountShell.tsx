import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { SquareMark } from "@/components/ui/SquareMark";

type Props = { children: ReactNode; nav?: ReactNode };

/** Plain header + centred column for account pages (no 3D hero, light on phones). */
export function AccountShell({ children, nav }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-bg/70 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label={`${site.name} home`}>
            <SquareMark className="size-7" />
            <span className="font-display text-xs font-semibold uppercase tracking-[0.22em] sm:text-sm">
              The Square<span className="text-gold"> Lounge</span>
            </span>
          </Link>
          {nav && <nav className="flex items-center gap-2 text-sm">{nav}</nav>}
        </Container>
      </header>
      <main id="main" className="flex-1 py-10 sm:py-16">
        <Container className="max-w-2xl">{children}</Container>
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
