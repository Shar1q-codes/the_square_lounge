"use client";

import { useActionState } from "react";
import { staffLogIn } from "@/app/staff/login/actions";
import { emptyFormState } from "@/lib/forms";
import { FormMessage, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";

export function StaffLoginForm() {
  const [state, action] = useActionState(staffLogIn, emptyFormState);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <Card className="p-5 sm:p-8">
      <form action={action} noValidate className="grid gap-5">
        <FormMessage error={e.form} />
        <TextField name="username" label="Username" autoComplete="username" autoCapitalize="none" defaultValue={v.username} error={e.username} />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" error={e.password} />
        <SubmitButton size="lg" pendingLabel="Logging in…" className="w-full">
          Log in
        </SubmitButton>
      </form>
    </Card>
  );
}
