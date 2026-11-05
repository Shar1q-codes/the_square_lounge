"use client";

import { useActionState, useState } from "react";
import { cancelVoucherAction, type CancelState } from "@/app/(gamer)/account/vouchers/actions";
import { istDateTime } from "@/lib/sessions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { SubmitButton } from "./SubmitButton";

export type VoucherView = {
  id: string;
  code: string;
  offerTitle: string;
  offerDescription: string;
  status: "active" | "used" | "expired" | "cancelled";
  pointsSpent: number;
  expiresAt: Date;
  usedAt: Date | null;
  qrSvg?: string;
};

const statusText = (v: VoucherView) =>
  ({
    active: `Valid until ${istDateTime(v.expiresAt)}`,
    used: `Used ${v.usedAt ? istDateTime(v.usedAt) : ""}`,
    expired: "Expired, Lounge Points refunded",
    cancelled: "Cancelled, Lounge Points refunded",
  })[v.status];

function CancelButton({ voucherId, points }: { voucherId: string; points: number }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action] = useActionState(cancelVoucherAction, {} as CancelState);
  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        Cancel and refund
      </Button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="voucherId" value={voucherId} />
      <SubmitButton size="sm" variant="secondary" pendingLabel="Cancelling…">
        Yes, give me {points} Lounge Points back
      </SubmitButton>
      {state.error && <p className="text-sm text-red-300">{state.error}</p>}
    </form>
  );
}

export function VoucherCard({ voucher, highlight }: { voucher: VoucherView; highlight?: boolean }) {
  const active = voucher.status === "active";
  return (
    <Card className={cn("grid gap-4 p-5", highlight && "border-gold/60", !active && "opacity-70")}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        {active && voucher.qrSvg && (
          <div
            className="size-32 shrink-0 self-center overflow-hidden rounded-xl bg-fg p-2 [&>svg]:size-full"
            role="img"
            aria-label={`QR code for voucher ${voucher.code}`}
            // SVG generated on the server by the qrcode library from our own voucher code.
            dangerouslySetInnerHTML={{ __html: voucher.qrSvg }}
          />
        )}
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">{voucher.offerTitle}</p>
          {voucher.offerDescription && <p className="text-sm text-muted">{voucher.offerDescription}</p>}
          <p className={cn("mt-2 font-mono text-2xl tracking-[0.15em]", active ? "text-gold-soft" : "text-muted line-through")}>{voucher.code}</p>
          <p className="mt-1 text-sm text-muted">{statusText(voucher)}</p>
        </div>
      </div>
      {active && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">Show this at the counter.</p>
          <CancelButton voucherId={voucher.id} points={voucher.pointsSpent} />
        </div>
      )}
    </Card>
  );
}
