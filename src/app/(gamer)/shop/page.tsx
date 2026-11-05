import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { ShopOfferCard } from "@/components/account/Shop";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { loyalty } from "@/config/loyalty";
import { currentGamer } from "@/server/identity/currentUser";
import { balanceOf } from "@/server/loyalty/ledger";
import { listShopOffers } from "@/server/loyalty/offers";
import { LoungePoints } from "@/components/brand/LoungePoints";

export const metadata: Metadata = {
  title: "Lounge Points shop | The Square Lounge",
  description: "Earn Lounge Points for every hour you play at The Square Lounge and swap them for free gaming time and café treats.",
  robots: { index: true, follow: true },
};

export default async function ShopPage() {
  const [gamer, offers] = await Promise.all([currentGamer(), listShopOffers()]);
  const balance = gamer ? await balanceOf(gamer.id) : null;

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="Square Lounge Rewards" title="Lounge Points shop">
        Earn <LoungePoints value={loyalty.pointsPerHour.PS5} className="font-medium text-gold-soft" /> for every hour you play, then swap them for these.
      </PageTitle>

      {balance === null ? (
        <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p>Join free to start earning Lounge Points on every visit.</p>
          <div className="flex gap-2">
            <Button href="/join" size="sm">
              Join rewards
            </Button>
            <Button href="/login" size="sm" variant="secondary">
              Log in
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex items-center justify-between gap-4 p-5">
          <p>
            You have <LoungePoints value={balance} className="font-display text-xl font-semibold text-gold-soft" />.
          </p>
          <Link href="/account/vouchers" className="text-sm text-gold underline-offset-4 hover:underline">
            My vouchers
          </Link>
        </Card>
      )}

      {offers.length === 0 ? (
        <p className="text-muted">New offers are coming soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <ShopOfferCard key={offer.id} offer={offer} balance={balance} />
          ))}
        </div>
      )}
    </div>
  );
}
