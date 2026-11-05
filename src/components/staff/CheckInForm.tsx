"use client";

import { useActionState, useCallback, useRef } from "react";
import { checkInAction, type CheckInState } from "@/app/staff/(portal)/actions";
import { gameOptions } from "@/lib/games";
import type { BoardStation } from "@/server/sessions/board";
import { FormMessage, SelectField, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";
import { ScanButton } from "./ScanButton";

export function CheckInForm({ stations }: { stations: BoardStation[] }) {
  const [state, action] = useActionState(checkInAction, {} as CheckInState);
  const queryRef = useRef<HTMLInputElement>(null);
  const e = state.errors ?? {};
  const options = stations.map((s) => {
    const full = s.players.length >= s.maxCheckIns;
    return { value: String(s.id), label: `${s.name} · ${s.console} · ${s.players.length}/${s.maxCheckIns}${full ? " (full)" : ""}` };
  });

  const onScan = useCallback((code: string) => {
    if (queryRef.current) queryRef.current.value = code;
  }, []);

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg font-semibold">Check in</h2>
      <form action={action} noValidate className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_15rem_15rem_auto] md:items-end">
        <div className="flex items-end gap-2">
          <TextField
            ref={queryRef}
            name="query"
            label="Member code, email or mobile"
            placeholder="SQ-7K2QM"
            autoComplete="off"
            autoCapitalize="characters"
            autoFocus
            error={e.query}
            wrapperClassName="flex-1"
          />
          <ScanButton onCode={onScan} />
        </div>
        <SelectField
          name="stationId"
          label="Station"
          options={options}
          placeholder="Choose…"
          defaultValue={state.stationId ?? ""}
          key={state.stationId ?? "none"}
          error={e.stationId}
        />
        <SelectField name="game" label="Game (optional)" options={gameOptions()} placeholder="Not sure yet" defaultValue="" />
        <SubmitButton pendingLabel="Checking in…">Check in</SubmitButton>
      </form>

      <div className="mt-4 grid gap-3 empty:hidden">
        <FormMessage error={e.form} notice={state.ok ? state.message : undefined} />
        {state.choices && (
          <div className="grid gap-2">
            <p className="text-sm text-muted">{state.message}</p>
            {state.choices.map((c) => (
              <form key={c.gamerId} action={action}>
                <input type="hidden" name="gamerId" value={c.gamerId} />
                <input type="hidden" name="stationId" value={state.stationId} />
                <input type="hidden" name="game" value={state.game ?? ""} />
                <SubmitButton variant="secondary" size="sm">
                  {c.fullName} · {c.memberCode}
                </SubmitButton>
              </form>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
