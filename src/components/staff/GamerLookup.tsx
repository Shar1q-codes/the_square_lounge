"use client";

import { useActionState } from "react";
import {
  adjustPointsAction,
  issueTemporaryPassword,
  lookupGamers,
  type AdjustState,
  type LookupResult,
  type LookupState,
  type TempPasswordState,
} from "@/app/staff/(portal)/gamers/actions";
import { FormMessage, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";

const joined = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(d),
  );

function TempPassword({ gamerId }: { gamerId: string }) {
  const [state, action] = useActionState(issueTemporaryPassword, {} as TempPasswordState);
  if (state.password) {
    return (
      <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
        Temporary password: <span className="font-mono text-base tracking-wider text-fg">{state.password}</span>
        <br />
        Ask them to log in and change it from their account page.
      </p>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="gamerId" value={gamerId} />
      {state.error && <p className="mb-2 text-sm text-red-300">{state.error}</p>}
      <SubmitButton variant="secondary" size="sm" pendingLabel="Setting…">
        Set temporary password
      </SubmitButton>
    </form>
  );
}

function AdjustPoints({ gamerId }: { gamerId: string }) {
  const [state, action] = useActionState(adjustPointsAction, {} as AdjustState);
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
      <input type="hidden" name="gamerId" value={gamerId} />
      <TextField name="points" label="Points (+/−)" inputMode="numeric" placeholder="50 or -50" error={e.points} />
      <TextField name="reason" label="Reason" placeholder="Birthday gift" error={e.reason} />
      <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
        Adjust points
      </SubmitButton>
      <div className="sm:col-span-3">
        <FormMessage error={e.form} notice={state.notice} />
      </div>
    </form>
  );
}

function GamerCard({ gamer, canAdjust }: { gamer: LookupResult; canAdjust: boolean }) {
  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg font-semibold">{gamer.fullName}</p>
        <p className="font-mono tracking-[0.12em] text-gold-soft">{gamer.memberCode}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-5">
        {[
          ["Points", String(gamer.balance)],
          ["Mobile", gamer.phone ?? "—"],
          ["Age", gamer.ageBand],
          ["Area", gamer.area],
          ["Joined", joined(gamer.createdAt)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-[0.15em] text-muted">{label}</dt>
            <dd className="mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>
      <TempPassword gamerId={gamer.id} />
      {canAdjust && <AdjustPoints gamerId={gamer.id} />}
    </Card>
  );
}

export function GamerLookup({ canAdjust }: { canAdjust: boolean }) {
  const [state, action] = useActionState(lookupGamers, {} as LookupState);

  return (
    <div className="grid gap-6">
      <Card className="p-5 sm:p-6">
        <form action={action} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <TextField
            name="q"
            label="Member code, email or mobile"
            placeholder="SQ-7K2QM"
            autoComplete="off"
            autoCapitalize="none"
            defaultValue={state.query}
            error={state.error}
            wrapperClassName="flex-1"
          />
          <SubmitButton pendingLabel="Searching…">Search</SubmitButton>
        </form>
      </Card>

      {state.results && state.results.length === 0 && (
        <FormMessage error={`No gamer found for "${state.query}". Check for typos; partial matches aren't searched.`} />
      )}
      {state.results?.map((gamer) => <GamerCard key={gamer.id} gamer={gamer} canAdjust={canAdjust} />)}
    </div>
  );
}
