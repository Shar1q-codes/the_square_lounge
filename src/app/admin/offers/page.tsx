import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { OfferForm, OfferList } from "@/components/staff/OfferAdmin";
import { Card } from "@/components/ui/Card";
import { listOffersForAdmin } from "@/server/loyalty/offers";

export const metadata: Metadata = { title: "Offers | The Square Lounge" };

export default async function AdminOffersPage() {
  const offers = await listOffersForAdmin();
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageTitle eyebrow="Admin" title="Lounge Points shop offers">
        Members earn 10 Lounge Points per hour played. Hide an offer to take it out of the shop; vouchers already claimed stay valid.
      </PageTitle>
      <OfferList offers={offers} />
      <Card className="p-5 sm:p-8">
        <h2 className="mb-6 font-display text-xl font-semibold">Add an offer</h2>
        <OfferForm />
      </Card>
    </div>
  );
}
