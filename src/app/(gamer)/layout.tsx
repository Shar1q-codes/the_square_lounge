import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { currentGamer } from "@/server/identity/currentUser";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const linkClass = "rounded-full px-3 py-2 text-muted transition-colors hover:text-fg";

export default async function GamerLayout({ children }: { children: ReactNode }) {
  const gamer = await currentGamer();
  return (
    <AccountShell
      nav={
        gamer ? (
          <>
            <Link href="/shop" className={linkClass}>
              Shop
            </Link>
            <Link href="/account" className={linkClass}>
              My account
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
            <Link href="/join" className={linkClass}>
              Join
            </Link>
          </>
        )
      }
    >
      {children}
    </AccountShell>
  );
}
