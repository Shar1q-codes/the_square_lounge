"use client";

import { useActionState } from "react";
import { deleteAccount, updateMarketing } from "@/app/(gamer)/account/privacy/actions";
import { emptyFormState } from "@/lib/forms";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckboxField, FormMessage, TextField } from "./fields";
import { SubmitButton } from "./SubmitButton";

export function MarketingForm({ optedIn }: { optedIn: boolean }) {
  const [state, action] = useActionState(updateMarketing, emptyFormState);
  return (
    <Card className="p-5 sm:p-8">
      <h2 className="mb-4 font-display text-xl font-semibold">Offers and news</h2>
      <form action={action} className="grid gap-4">
        <FormMessage notice={state.notice} />
        <CheckboxField name="marketingOptIn" defaultChecked={optedIn}>
          Send me offers and tournament news. We never send SMS.
        </CheckboxField>
        <div>
          <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
            Save choice
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}

export function DownloadData() {
  return (
    <Card className="p-5 sm:p-8">
      <h2 className="mb-2 font-display text-xl font-semibold">Download my data</h2>
      <p className="mb-4 text-sm text-muted">A file with your profile and consent history.</p>
      <Button href="/account/privacy/export" variant="secondary" size="sm" download>
        Download (JSON)
      </Button>
    </Card>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, emptyFormState);
  const e = state.errors ?? {};
  return (
    <Card className="border-red-400/30 p-5 sm:p-8">
      <h2 className="mb-2 font-display text-xl font-semibold">Delete my account</h2>
      <p className="mb-5 text-sm text-muted">
        This erases your name, email, mobile number and password straight away and can&apos;t be undone. Unused Lounge Points
        and vouchers are lost.
      </p>
      <form action={action} noValidate className="grid gap-4">
        <TextField name="password" label="Your password" type="password" autoComplete="current-password" error={e.password} />
        <CheckboxField name="confirm" error={e.confirm}>
          I understand my account will be deleted permanently.
        </CheckboxField>
        <div>
          <SubmitButton variant="secondary" size="sm" pendingLabel="Deleting…" className="border-red-400/50 text-red-200 hover:border-red-400 hover:text-red-100">
            Delete my account
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
