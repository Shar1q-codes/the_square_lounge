"use client";

import { useActionState } from "react";
import { addStaff, resetPassword, toggleStaffActive, type RowState } from "@/app/admin/staff/actions";
import { emptyFormState } from "@/lib/forms";
import { FormMessage, SelectField, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";

function Pill({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-strong px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
      {children}
    </span>
  );
}

export type StaffRow = { id: string; username: string; displayName: string; role: "staff" | "admin"; active: boolean };

const roleOptions = [
  { value: "staff", label: "Counter staff" },
  { value: "admin", label: "Admin (full access)" },
];

export function AddStaffForm() {
  const [state, action] = useActionState(addStaff, emptyFormState);
  const v = state.values ?? {};
  const e = state.errors ?? {};
  return (
    <Card className="p-5 sm:p-8">
      <h2 className="mb-6 font-display text-xl font-semibold">Add a staff member</h2>
      <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormMessage notice={state.notice} />
        </div>
        <TextField name="displayName" label="Name" defaultValue={v.displayName} error={e.displayName} />
        <TextField name="username" label="Username" autoCapitalize="none" autoComplete="off" defaultValue={v.username} error={e.username} hint="Letters, numbers, dots or underscores." />
        <SelectField name="role" label="Role" options={roleOptions} defaultValue={v.role ?? "staff"} error={e.role} />
        <TextField name="password" label="Temporary password" type="password" autoComplete="new-password" error={e.password} hint="At least 8 characters. Tell them in person." />
        <div className="sm:col-span-2">
          <SubmitButton pendingLabel="Adding…">Add staff member</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function StaffRowCard({ row, isSelf }: { row: StaffRow; isSelf: boolean }) {
  const [toggleState, toggle] = useActionState(toggleStaffActive, {} as RowState);
  const [resetState, reset] = useActionState(resetPassword, {} as RowState);

  return (
    <Card className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">
            {row.displayName} {isSelf && <span className="text-sm font-normal text-muted">(you)</span>}
          </p>
          <p className="font-mono text-sm text-muted">{row.username}</p>
        </div>
        <div className="flex gap-2">
          <Pill>{row.role === "admin" ? "Admin" : "Staff"}</Pill>
          {!row.active && <Pill>Deactivated</Pill>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {!isSelf && (
          <form action={toggle}>
            <input type="hidden" name="staffId" value={row.id} />
            <input type="hidden" name="active" value={String(!row.active)} />
            <SubmitButton variant="secondary" size="sm" pendingLabel="Saving…">
              {row.active ? "Deactivate" : "Reactivate"}
            </SubmitButton>
          </form>
        )}
        <form action={reset}>
          <input type="hidden" name="staffId" value={row.id} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Resetting…">
            Reset password
          </SubmitButton>
        </form>
      </div>

      {toggleState.error && <p className="text-sm text-red-300">{toggleState.error}</p>}
      {resetState.password && (
        <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-soft">
          New temporary password: <span className="font-mono text-base tracking-wider text-fg">{resetState.password}</span>
          {isSelf && " You'll need to log in again."}
        </p>
      )}
    </Card>
  );
}

export function StaffList({ rows, selfId }: { rows: StaffRow[]; selfId: string }) {
  return (
    <div className="grid gap-4">
      {rows.map((row) => (
        <StaffRowCard key={row.id} row={row} isSelf={row.id === selfId} />
      ))}
    </div>
  );
}
