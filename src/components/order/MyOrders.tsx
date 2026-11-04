"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cancelOrderAction } from "@/app/(gamer)/order/actions";
import { ORDER_STATUS_LABEL, rupees } from "@/lib/orders";
import type { OrderView } from "@/server/orders/orders";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";

const REFRESH_MS = 10_000;

const time = (d: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" }).format(d);

/** Today's orders with their status; checks for updates while any are still on the way. */
export function MyOrders({ orders }: { orders: OrderView[] }) {
  const router = useRouter();
  const waiting = orders.some((o) => o.status === "new" || o.status === "preparing");

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [waiting, router]);

  if (orders.length === 0) return null;
  return (
    <section aria-labelledby="my-orders" className="grid gap-3">
      <h2 id="my-orders" className="font-display text-lg font-semibold">
        Your orders today
      </h2>
      {orders.map((o) => (
        <Card key={o.id} className="grid gap-2 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted">
              {time(o.createdAt)} · {o.stationName} · {rupees(o.total)}
            </p>
            <p
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                o.status === "new" && "bg-gold/15 text-gold-soft",
                o.status === "preparing" && "bg-sky-400/15 text-sky-200",
                o.status === "delivered" && "bg-emerald-400/15 text-emerald-200",
                o.status === "cancelled" && "bg-white/10 text-muted",
              )}
            >
              {ORDER_STATUS_LABEL[o.status]}
            </p>
          </div>
          <ul className="text-sm">
            {o.lines.map((l, i) => (
              <li key={i}>
                {l.quantity} × {l.name}
                {l.option && <span className="text-muted"> · {l.option}</span>}
              </li>
            ))}
          </ul>
          {o.note && <p className="text-sm text-muted">Note: {o.note}</p>}
          {o.status === "new" && (
            <form action={cancelOrderAction}>
              <input type="hidden" name="orderId" value={o.id} />
              <SubmitButton size="sm" variant="ghost" pendingLabel="Cancelling…" className="px-0 text-muted hover:text-fg">
                Cancel order
              </SubmitButton>
            </form>
          )}
        </Card>
      ))}
      {waiting && <p className="text-xs text-muted">This list updates by itself.</p>}
    </section>
  );
}
