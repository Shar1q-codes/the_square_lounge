"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/(gamer)/account/actions";
import { emptyFormState } from "@/lib/forms";
import { Card } from "@/components/ui/Card";
import { FormMessage, TextField } from "./fields";
import { SubmitButton } from "./SubmitButton";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, emptyFormState);
  const e = state.errors ?? {};

  return (
    <Card className="p-5 sm:p-8">
      <h2 className="mb-6 font-display text-xl font-semibold">Change password</h2>
      <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormMessage notice={state.notice} />
        </div>
        <TextField name="currentPassword" label="Current password" type="password" autoComplete="current-password" error={e.currentPassword} />
        <TextField name="newPassword" label="New password" type="password" autoComplete="new-password" minLength={8} error={e.newPassword} hint="At least 8 characters." />
        <div className="sm:col-span-2">
          <SubmitButton variant="secondary" pendingLabel="Changing…">
            Change password
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
