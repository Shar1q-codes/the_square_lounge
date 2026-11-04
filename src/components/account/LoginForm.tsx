"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logIn } from "@/app/(gamer)/login/actions";
import { emptyFormState } from "@/lib/forms";
import { Card } from "@/components/ui/Card";
import { FormMessage, TextField } from "./fields";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ next = "/account" }: { next?: string }) {
  const [state, action] = useActionState(logIn, emptyFormState);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  return (
    <Card className="p-5 sm:p-8">
      <form action={action} noValidate className="grid gap-5">
        <input type="hidden" name="next" value={next} />
        <FormMessage error={e.form} />
        <TextField name="email" label="Email" type="email" autoComplete="email" required defaultValue={v.email} error={e.email} />
        <TextField name="password" label="Password" type="password" autoComplete="current-password" required error={e.password} />
        <SubmitButton size="lg" pendingLabel="Logging in…" className="w-full">
          Log in
        </SubmitButton>
        <div className="grid gap-2 text-sm text-muted">
          <p>
            New here?{" "}
            <Link href="/join" className="text-gold underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
          <p>Forgot your password? Ask at the counter and we&apos;ll set a temporary one.</p>
        </div>
      </form>
    </Card>
  );
}
