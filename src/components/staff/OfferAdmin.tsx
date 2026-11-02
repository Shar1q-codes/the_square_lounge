"use client";

import { useActionState, useState } from "react";
import { saveOffer } from "@/app/admin/offers/actions";
import type { FormState } from "@/lib/forms";
import { istDateTime, istInputValue } from "@/lib/sessions";
import { CheckboxField, FormMessage, SelectField, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type AdminOffer = {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: "gaming" | "cafe" | "other";
  stock: number | null;
  maxPerGamer: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
  claimed: number;
};

const categoryOptions = [
  { value: "gaming", label: "Gaming" },
  { value: "cafe", label: "Café" },
  { value: "other", label: "Other" },
];

const toValues = (o: AdminOffer): Record<string, string> => ({
  title: o.title,
  description: o.description,
  pointsCost: String(o.pointsCost),
  category: o.category,
  stock: o.stock === null ? "" : String(o.stock),
  maxPerGamer: o.maxPerGamer === null ? "" : String(o.maxPerGamer),
  startsAt: o.startsAt ? istInputValue(o.startsAt) : "",
  endsAt: o.endsAt ? istInputValue(o.endsAt) : "",
  active: o.active ? "on" : "",
});

export function OfferForm({ offer }: { offer?: AdminOffer }) {
  const defaults = offer ? toValues(offer) : { category: "gaming", active: "on" };
  const [state, action] = useActionState(saveOffer, { values: defaults } satisfies FormState);
  // After adding an offer the action returns no values, so the form starts fresh with the defaults.
  const v = state.values ?? defaults;
  const e = state.errors ?? {};

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2" key={state.notice}>
      {offer && <input type="hidden" name="offerId" value={offer.id} />}
      <div className="sm:col-span-2">
        <FormMessage error={e.form} notice={state.notice} />
      </div>
      <TextField name="title" label="Offer" placeholder="Free PS4 hour" defaultValue={v.title} error={e.title} wrapperClassName="sm:col-span-2" />
      <TextField name="description" label="Details (optional)" placeholder="One hour on any PS4 station. Not valid on weekends." defaultValue={v.description} error={e.description} wrapperClassName="sm:col-span-2" />
      <TextField name="pointsCost" label="Points cost" inputMode="numeric" defaultValue={v.pointsCost} error={e.pointsCost} />
      <SelectField name="category" label="Category" options={categoryOptions} defaultValue={v.category} error={e.category} />
      <TextField name="stock" label="Total available (optional)" inputMode="numeric" placeholder="Unlimited" defaultValue={v.stock} error={e.stock} />
      <TextField name="maxPerGamer" label="Max per member (optional)" inputMode="numeric" placeholder="No limit" defaultValue={v.maxPerGamer} error={e.maxPerGamer} />
      <TextField name="startsAt" label="Starts (optional)" type="datetime-local" defaultValue={v.startsAt} error={e.startsAt} />
      <TextField name="endsAt" label="Ends (optional)" type="datetime-local" defaultValue={v.endsAt} error={e.endsAt} />
      <div className="sm:col-span-2">
        <CheckboxField name="active" defaultChecked={v.active === "on"}>
          Show in the shop
        </CheckboxField>
      </div>
      <div className="sm:col-span-2">
        <SubmitButton pendingLabel="Saving…">{offer ? "Save offer" : "Add offer"}</SubmitButton>
      </div>
    </form>
  );
}

function OfferRow({ offer }: { offer: AdminOffer }) {
  const [editing, setEditing] = useState(false);
  const stock = offer.stock === null ? `${offer.claimed} claimed` : `${offer.claimed} of ${offer.stock} claimed`;
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">
            {offer.title} {!offer.active && <span className="text-sm font-normal text-muted">(hidden)</span>}
          </p>
          <p className="text-sm text-muted">
            {stock}
            {offer.maxPerGamer ? ` · max ${offer.maxPerGamer} per member` : ""}
            {offer.endsAt ? ` · ends ${istDateTime(offer.endsAt)}` : ""}
          </p>
        </div>
        <p className="font-display text-lg font-semibold text-gold-soft">{offer.pointsCost} pts</p>
      </div>
      {editing ? (
        <OfferForm offer={offer} />
      ) : (
        <div>
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}
    </Card>
  );
}

export function OfferList({ offers }: { offers: AdminOffer[] }) {
  if (offers.length === 0) return <p className="text-muted">No offers yet. Add your first one below.</p>;
  return (
    <div className="grid gap-4">
      {offers.map((o) => (
        <OfferRow key={o.id} offer={o} />
      ))}
    </div>
  );
}
