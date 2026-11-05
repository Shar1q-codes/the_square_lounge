"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp } from "@/app/(gamer)/join/actions";
import { emptyFormState } from "@/lib/forms";
import { mayBeMinor } from "@/lib/age";
import { Card } from "@/components/ui/Card";
import { CheckboxField, FormMessage, SelectField, TextField } from "./fields";
import { genderOptions, referralOptions } from "./profileOptions";
import { SubmitButton } from "./SubmitButton";

export function SignUpForm({ currentYear }: { currentYear: number }) {
  const [state, action] = useActionState(signUp, emptyFormState);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const [birthYear, setBirthYear] = useState(v.birthYear ?? "");
  const showGuardian = /^\d{4}$/.test(birthYear) && mayBeMinor(Number(birthYear), currentYear);

  return (
    <Card className="p-5 sm:p-8">
      <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormMessage error={Object.keys(e).length ? "Please fix the highlighted fields." : undefined} />
        </div>

        <TextField name="fullName" label="Full name" autoComplete="name" required defaultValue={v.fullName} error={e.fullName} wrapperClassName="sm:col-span-2" />
        <TextField name="email" label="Email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} hint="You'll log in with this." />
        <TextField name="phone" label="Mobile number" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="98765 43210" required defaultValue={v.phone} error={e.phone} hint="Contact only. We never send SMS." />
        <TextField name="password" label="Password" type="password" autoComplete="new-password" minLength={8} required error={e.password} hint="At least 8 characters." wrapperClassName="sm:col-span-2" />
        <TextField
          name="birthYear"
          label="Birth year"
          inputMode="numeric"
          pattern="\d{4}"
          maxLength={4}
          placeholder="2003"
          required
          defaultValue={v.birthYear}
          onChange={(ev) => setBirthYear(ev.target.value)}
          error={e.birthYear}
        />
        <SelectField name="gender" label="Gender (optional)" options={genderOptions} placeholder="Choose…" defaultValue={v.gender ?? ""} error={e.gender} />
        <TextField name="area" label="Area" placeholder="Malakpet" autoComplete="address-level3" required defaultValue={v.area} error={e.area} />
        <TextField name="pincode" label="Pincode" inputMode="numeric" maxLength={6} placeholder="500036" autoComplete="postal-code" required defaultValue={v.pincode} error={e.pincode} />
        <SelectField name="referralSource" label="How did you hear about us?" options={referralOptions} placeholder="Choose…" required defaultValue={v.referralSource ?? ""} error={e.referralSource} wrapperClassName="sm:col-span-2" />
        <TextField name="favouriteGames" label="Favourite games (optional)" placeholder="FC 25, Tekken 8, GTA V" defaultValue={v.favouriteGames} hint="Separate with commas." wrapperClassName="sm:col-span-2" />

        <div className="grid gap-4 sm:col-span-2">
          {showGuardian && (
            <CheckboxField name="guardianConsent" defaultChecked={v.guardianConsent === "on"} error={e.guardianConsent}>
              I&apos;m under 18 and my parent or guardian agrees to me creating this account.
            </CheckboxField>
          )}
          <CheckboxField name="marketingOptIn" defaultChecked={v.marketingOptIn === "on"}>
            Send me offers and tournament news (optional, you can turn this off any time).
          </CheckboxField>
          <CheckboxField name="agreeTerms" required defaultChecked={v.agreeTerms === "on"} error={e.agreeTerms}>
            I agree to the{" "}
            <Link href="/privacy" className="text-gold underline-offset-4 hover:underline">
              privacy notice
            </Link>{" "}
            and to The Square Lounge using my details to run my account and Lounge Points.
          </CheckboxField>
        </div>

        <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <SubmitButton size="lg" pendingLabel="Creating account…" className="w-full sm:w-auto">
            Create my account
          </SubmitButton>
          <p className="text-sm text-muted">
            Already a member?{" "}
            <Link href="/login" className="text-gold underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </form>
    </Card>
  );
}
