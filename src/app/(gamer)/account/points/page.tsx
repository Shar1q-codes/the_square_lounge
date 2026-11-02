import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { Card } from "@/components/ui/Card";
import { formatPoints } from "@/lib/loyalty";
import { istDateTime } from "@/lib/sessions";
import { cn } from "@/lib/utils";
import { requireGamer } from "@/server/identity/currentUser";
import { balanceOf, ledgerFor } from "@/server/loyalty/ledger";

export const metadata: Metadata = { title: "My points | The Square Lounge" };

export default async function PointsPage() {
  const gamer = await requireGamer();
  const [balance, lines] = await Promise.all([balanceOf(gamer.id), ledgerFor(gamer.id)]);

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="My account" title="My points">
        You have <span className="font-display font-semibold text-gold-soft">{balance}</span> points.{" "}
        <Link href="/shop" className="text-gold underline-offset-4 hover:underline">
          Spend them in the shop
        </Link>
        .
      </PageTitle>
      <Card className="p-5 sm:p-8">
        {lines.length === 0 ? (
          <p className="text-sm text-muted">You earn points automatically each time you check out at the counter.</p>
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <span>
                  {l.description}
                  <span className="block text-xs text-muted">{istDateTime(l.createdAt)}</span>
                </span>
                <span className={cn("shrink-0 font-display font-semibold tabular-nums", l.delta > 0 ? "text-gold-soft" : "text-muted")}>
                  {formatPoints(l.delta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Link href="/account" className="text-sm text-gold underline-offset-4 hover:underline">
        ← Back to my account
      </Link>
    </div>
  );
}
