"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/(gamer)/account/actions";
import type { FormState } from "@/lib/forms";
import { Card } from "@/components/ui/Card";
import { FormMessage, SelectField, TextField } from "./fields";
import { genderOptions, referralOptions } from "./profileOptions";
import { SubmitButton } from "./SubmitButton";

export function ProfileForm({ initial }: { initial: Record<string, string> }) {
  const [state, action] = useActionState(saveProfile, { values: initial } satisfies FormState);
  const v = state.values ?? initial;
  const e = state.errors ?? {};

  return (
    <Card className="p-5 sm:p-8">
      <h2 className="mb-6 font-display text-xl font-semibold">Your details</h2>
      <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormMessage error={Object.keys(e).length ? "Please fix the highlighted fields." : undefined} notice={state.notice} />
        </div>
        <TextField name="fullName" label="Full name" autoComplete="name" defaultValue={v.fullName} error={e.fullName} wrapperClassName="sm:col-span-2" />
        <TextField name="email" label="Email" type="email" autoComplete="email" defaultValue={v.email} error={e.email} />
        <TextField name="phone" label="Mobile number" type="tel" inputMode="tel" defaultValue={v.phone} error={e.phone} hint="Contact only. We never send SMS." />
        <TextField name="birthYear" label="Birth year" inputMode="numeric" maxLength={4} defaultValue={v.birthYear} error={e.birthYear} />
        <SelectField name="gender" label="Gender (optional)" options={genderOptions} placeholder="Choose…" defaultValue={v.gender ?? ""} error={e.gender} />
        <TextField name="area" label="Area" defaultValue={v.area} error={e.area} />
        <TextField name="pincode" label="Pincode" inputMode="numeric" maxLength={6} defaultValue={v.pincode} error={e.pincode} />
        <SelectField name="referralSource" label="How did you hear about us?" options={referralOptions} defaultValue={v.referralSource} error={e.referralSource} wrapperClassName="sm:col-span-2" />
        <TextField name="favouriteGames" label="Favourite games" defaultValue={v.favouriteGames} hint="Separate with commas." wrapperClassName="sm:col-span-2" />
        <div className="sm:col-span-2">
          <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
