"use client";

import { useActionState, useState } from "react";
import { claimAction, type ClaimState } from "@/app/(gamer)/shop/actions";
import type { ShopOffer } from "@/server/loyalty/offers";
import { istDateTime } from "@/lib/sessions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SubmitButton } from "./SubmitButton";
import { LoungePoints } from "@/components/brand/LoungePoints";

const categoryLabel = { gaming: "Gaming", cafe: "Café", other: "Other" } as const;

/** `balance` is null for visitors who aren't logged in. */
export function ShopOfferCard({ offer, balance }: { offer: ShopOffer; balance: number | null }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState(claimAction, {} as ClaimState);
  const short = balance === null ? 0 : offer.pointsCost - balance;

  return (
    <Card as="article" className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">{categoryLabel[offer.category]}</p>
          <h2 className="mt-1 font-display text-lg font-semibold">{offer.title}</h2>
        </div>
        <p className="shrink-0 font-display text-xl font-semibold text-gold-soft">
          <LoungePoints value={offer.pointsCost} label={false} />
        </p>
      </div>
      {offer.description && <p className="text-sm text-muted">{offer.description}</p>}
      {(offer.remaining !== null || offer.endsAt) && (
        <p className="text-xs text-muted">
          {offer.remaining !== null && `${offer.remaining} left`}
          {offer.remaining !== null && offer.endsAt && " · "}
          {offer.endsAt && `until ${istDateTime(offer.endsAt)}`}
        </p>
      )}

      <div className="mt-auto grid gap-2">
        {balance === null ? null : short > 0 ? (
          <p className="text-sm text-muted">You need {short} more Lounge Points.</p>
        ) : confirming ? (
          <form action={action} className="flex flex-wrap gap-2">
            <input type="hidden" name="offerId" value={offer.id} />
            <SubmitButton size="sm" pendingLabel="Claiming…">
              Confirm: spend {offer.pointsCost} Lounge Points
            </SubmitButton>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Not now
            </Button>
          </form>
        ) : (
          <Button size="sm" onClick={() => setConfirming(true)}>
            Claim
          </Button>
        )}
        {state.error && <p className="text-sm text-red-300">{state.error}</p>}
      </div>
    </Card>
  );
}
