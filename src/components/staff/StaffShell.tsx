import Link from "next/link";
import type { ReactNode } from "react";
import type { Staff } from "@/db/schema";
import { staffLogOut } from "@/app/staff/login/actions";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderAlerts } from "./OrderAlerts";
import { ScanMember } from "./ScanMember";

const linkClass = "rounded-full px-3 py-2 text-muted transition-colors hover:text-fg";

/** Shell for the counter and admin pages, with role-aware navigation. */
export function StaffShell({ member, children }: { member: Staff; children: ReactNode }) {
  return (
    <AccountShell
      wide
      nav={
        <>
          <Link href="/staff" className={linkClass}>
            Board
          </Link>
          <ScanMember className={linkClass} />
          <OrderAlerts className={linkClass} />
          <Link href="/staff/gamers" className={linkClass}>
            Gamers
          </Link>
          <Link href="/staff/vouchers" className={linkClass}>
            Vouchers
          </Link>
          {member.role === "admin" && (
            <>
              <Link href="/admin/analytics" className={linkClass}>
                Analytics
              </Link>
              <Link href="/admin/sessions" className={linkClass}>
                Sessions
              </Link>
              <Link href="/admin/offers" className={linkClass}>
                Offers
              </Link>
              <Link href="/admin/staff" className={linkClass}>
                Staff
              </Link>
            </>
          )}
          <form action={staffLogOut}>
            <button type="submit" className={linkClass}>
              Log out
            </button>
          </form>
        </>
      }
    >
      {children}
    </AccountShell>
  );
}
