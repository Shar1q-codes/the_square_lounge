"use client";

import { useActionState, useCallback, useRef } from "react";
import {
  lookupVoucherAction,
  redeemVoucherAction,
  type VoucherLookupState,
} from "@/app/staff/(portal)/vouchers/actions";
import { istDateTime } from "@/lib/sessions";
import type { CounterVoucher } from "@/server/loyalty/vouchers";
import { FormMessage, TextField } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ScanButton } from "./ScanButton";

const statusLine = (v: CounterVoucher) =>
  ({
    active: `Valid until ${istDateTime(v.expiresAt)}`,
    used: `Already used${v.usedAt ? ` on ${istDateTime(v.usedAt)}` : ""}`,
    expired: "Expired (points were refunded)",
    cancelled: "Cancelled (points were refunded)",
  })[v.status];

function VoucherDetails({ voucher }: { voucher: CounterVoucher }) {
  const [state, redeem] = useActionState(redeemVoucherAction, {} as VoucherLookupState);
  const shown = state.voucher ?? voucher;
  const usable = shown.status === "active";

  return (
    <Card className={cn("grid gap-4 p-5 sm:p-6", usable ? "border-gold/50" : "border-red-400/40")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl font-semibold">{shown.offerTitle}</p>
          <p className="text-sm text-muted">
            {shown.gamerName ?? "Deleted account"} · <span className="font-mono tracking-wider">{shown.memberCode}</span>
          </p>
        </div>
        <p className="font-mono text-lg tracking-[0.12em] text-gold-soft">{shown.code}</p>
      </div>
      <p className={cn("text-sm", usable ? "text-muted" : "text-red-300")}>{statusLine(shown)}</p>
      <FormMessage error={state.error} notice={state.notice} />
      {usable && (
        <form action={redeem}>
          <input type="hidden" name="voucherId" value={shown.id} />
          <input type="hidden" name="code" value={shown.code} />
          <SubmitButton pendingLabel="Saving…">Mark as used</SubmitButton>
        </form>
      )}
    </Card>
  );
}

export function VoucherRedeem() {
  const [state, lookup] = useActionState(lookupVoucherAction, {} as VoucherLookupState);
  const codeRef = useRef<HTMLInputElement>(null);
  const onScan = useCallback((code: string) => {
    if (codeRef.current) codeRef.current.value = code;
  }, []);

  return (
    <div className="grid gap-6">
      <Card className="p-5 sm:p-6">
        <form action={lookup} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 items-end gap-2">
            <TextField
              ref={codeRef}
              name="code"
              label="Voucher code"
              placeholder="V-7K2QM4"
              autoComplete="off"
              autoCapitalize="characters"
              autoFocus
              defaultValue={state.query}
              error={state.error && !state.voucher ? state.error : undefined}
              wrapperClassName="flex-1"
            />
            <ScanButton onCode={onScan} />
          </div>
          <SubmitButton pendingLabel="Checking…">Check</SubmitButton>
        </form>
      </Card>
      {state.voucher && <VoucherDetails key={state.voucher.id + state.voucher.status} voucher={state.voucher} />}
    </div>
  );
}
