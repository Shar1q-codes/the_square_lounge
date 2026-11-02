"use client";

import { useActionState, useState } from "react";
import { correctSessionAction, type CorrectionState } from "@/app/admin/sessions/actions";
import { formatDuration, istDateTime, istInputValue, minutesBetween, needsAttention } from "@/lib/sessions";
import type { AdminSessionRow } from "@/server/sessions/corrections";
import { FormMessage, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const statusLabel = { open: "Playing", closed: "Closed", voided: "Cancelled" } as const;

function CorrectionForm({ row, now, filter }: { row: AdminSessionRow; now: Date; filter: string }) {
  const [state, action] = useActionState(correctSessionAction, {} as CorrectionState);
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="sessionId" value={row.id} />
      <input type="hidden" name="filter" value={filter} />
      <div className="sm:col-span-2">
        <FormMessage error={e.form} />
      </div>
      <TextField name="startedAt" label="Started (India time)" type="datetime-local" defaultValue={istInputValue(row.startedAt)} error={e.startedAt} />
      <TextField name="endedAt" label="Ended (India time)" type="datetime-local" defaultValue={istInputValue(row.endedAt ?? now)} error={e.endedAt} />
      <TextField name="reason" label="Reason" placeholder="Forgot to check out at closing" error={e.reason} wrapperClassName="sm:col-span-2" />
      <div className="sm:col-span-2">
        <SubmitButton size="sm" pendingLabel="Saving…">Save correction</SubmitButton>
      </div>
    </form>
  );
}

export function SessionRow({ row, now, filter }: { row: AdminSessionRow; now: Date; filter: string }) {
  const [open, setOpen] = useState(false);
  const minutes = minutesBetween(row.startedAt, row.endedAt ?? now);
  const flagged = row.status === "open" && needsAttention(row.startedAt, now);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {row.fullName ?? "Deleted account"} <span className="font-mono text-xs tracking-wider text-muted">{row.memberCode}</span>
          </p>
          <p className="text-sm text-muted">
            {row.stationName} · {istDateTime(row.startedAt)}
            {row.endedAt ? ` → ${istDateTime(row.endedAt)}` : ""}
          </p>
          {row.voidReason && <p className="text-sm text-muted">Reason: {row.voidReason}</p>}
        </div>
        <div className="text-right">
          <p className={cn("font-display font-semibold", flagged && "text-red-300")}>{formatDuration(minutes)}</p>
          <p className={cn("text-[11px] uppercase tracking-wider", flagged ? "text-red-300" : "text-muted")}>
            {flagged ? "Needs attention" : statusLabel[row.status]}
          </p>
        </div>
      </div>
      {row.status !== "voided" &&
        (open ? (
          <CorrectionForm row={row} now={now} filter={filter} />
        ) : (
          <div>
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              {row.status === "open" ? "Close with corrected time" : "Correct times"}
            </Button>
          </div>
        ))}
    </Card>
  );
}
