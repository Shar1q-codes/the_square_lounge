"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { moveOrderAction } from "@/app/staff/(portal)/orders/actions";
import { ORDER_STATUS_LABEL, rupees } from "@/lib/orders";
import type { CounterOrder } from "@/server/orders/orders";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";

const REFRESH_MS = 5_000;

const time = (d: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(d);

function Move({ order, to, label, variant = "secondary" }: { order: CounterOrder; to: string; label: string; variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <form action={moveOrderAction}>
      <input type="hidden" name="orderId" value={order.id} />
      <input type="hidden" name="to" value={to} />
      <SubmitButton size="sm" variant={variant} pendingLabel="Saving…">
        {label}
      </SubmitButton>
    </form>
  );
}

function OrderCard({ order }: { order: CounterOrder }) {
  const open = order.status === "new" || order.status === "preparing";
  return (
    <Card
      as="article"
      aria-label={`${order.stationName} order`}
      className={cn("grid gap-3 p-5", order.status === "new" && "border-gold/60 shadow-[0_0_40px_rgb(212_178_106/0.12)]")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-xl font-semibold">{order.stationName}</p>
        <p className="text-sm text-muted">
          {time(order.createdAt)} · {ORDER_STATUS_LABEL[order.status]}
          {order.cancelledByGamer && " by the member"}
        </p>
      </div>
      <p className="text-sm text-muted">
        {order.gamerName ?? "Deleted account"} · <span className="font-mono tracking-wider">{order.memberCode}</span>
      </p>
      <ul className="grid gap-1">
        {order.lines.map((l, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span>
              <span className="font-semibold">{l.quantity} ×</span> {l.name}
              {l.option && <span className="text-muted"> · {l.option}</span>}
            </span>
            <span className="text-sm tabular-nums text-muted">{rupees(l.unitPrice * l.quantity)}</span>
          </li>
        ))}
      </ul>
      {order.note && <p className="rounded-xl bg-gold/10 px-3 py-2 text-sm text-gold-soft">Note: {order.note}</p>}
      <p className="flex justify-between border-t border-border pt-3 font-medium">
        <span>Total (add to the bill)</span>
        <span className="tabular-nums">{rupees(order.total)}</span>
      </p>
      {open && (
        <div className="flex flex-wrap gap-2">
          {order.status === "new" && <Move order={order} to="preparing" label="Start preparing" variant="primary" />}
          <Move order={order} to="delivered" label="Delivered" variant={order.status === "preparing" ? "primary" : "secondary"} />
          <Move order={order} to="cancelled" label="Cancel" variant="ghost" />
        </div>
      )}
    </Card>
  );
}

/** Station orders for the counter and kitchen, kept up to date every few seconds. */
export function OrderQueue({ open, recent }: { open: CounterOrder[]; recent: CounterOrder[] }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    // The buzzer in the staff menu announces new orders the moment it hears of them.
    window.addEventListener("staff:new-order", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("staff:new-order", refresh);
    };
  }, [router]);

  return (
    <div className="grid gap-8">
      <section aria-labelledby="open-orders" className="grid gap-4">
        <h2 id="open-orders" className="font-display text-lg font-semibold">
          To do {open.length > 0 && <span className="text-gold">({open.length})</span>}
        </h2>
        {open.length === 0 ? (
          <p className="text-muted">No orders waiting. New ones appear here with a buzz.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {open.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </section>
      {recent.length > 0 && (
        <section aria-labelledby="done-orders" className="grid gap-4">
          <h2 id="done-orders" className="font-display text-lg font-semibold text-muted">
            Done today
          </h2>
          <div className="grid gap-4 opacity-80 md:grid-cols-2 xl:grid-cols-3">
            {recent.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
