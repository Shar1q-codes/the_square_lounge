"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { placeOrderAction, type OrderState } from "@/app/(gamer)/order/actions";
import { cafe, menuItems } from "@/config/menu";
import { itemName, ORDER_LIMITS, rupees, type CartLine } from "@/lib/orders";
import { cn } from "@/lib/utils";
import { FormMessage } from "@/components/account/fields";
import { SubmitButton } from "@/components/account/SubmitButton";
import { Card } from "@/components/ui/Card";

type Cart = Record<string, number>;
const keyOf = (itemId: string, optionId: string) => `${itemId}/${optionId}`;

function Stepper({ label, quantity, onChange }: { label: string; quantity: number; onChange: (q: number) => void }) {
  const button = "inline-flex size-9 items-center justify-center rounded-full border border-border-strong text-lg leading-none";
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className={button} aria-label={`One less ${label}`} onClick={() => onChange(quantity - 1)}>
        −
      </button>
      <span className="w-5 text-center tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className={button}
        aria-label={`One more ${label}`}
        disabled={quantity >= ORDER_LIMITS.quantity}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </span>
  );
}

/**
 * The café menu with add buttons and a cart that sends the order to the gamer's station.
 * Without `stationName` (not logged in or not checked in) it is a plain menu.
 */
export function OrderMenu({ stationName }: { stationName: string | null }) {
  const [cart, setCart] = useState<Cart>({});
  const [state, action] = useActionState(placeOrderAction, {} as OrderState);

  // A successful order empties the cart.
  useEffect(() => {
    if (state.placedAt) setCart({});
  }, [state.placedAt]);

  const setQuantity = (key: string, quantity: number) =>
    setCart((c) => {
      const next = { ...c };
      if (quantity <= 0) delete next[key];
      else next[key] = Math.min(quantity, ORDER_LIMITS.quantity);
      return next;
    });

  const lines = useMemo(
    () =>
      Object.entries(cart).flatMap(([key, quantity]) => {
        const [itemId, optionId] = key.split("/");
        const item = menuItems.get(itemId);
        const option = item?.options.find((o) => o.id === optionId);
        if (!item || !option) return [];
        return [{ key, itemId, optionId, quantity, label: itemName(item.name, item.note) + (option.label ? ` · ${option.label}` : ""), price: option.price }];
      }),
    [cart],
  );
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);
  const payload: CartLine[] = lines.map(({ itemId, optionId, quantity }) => ({ itemId, optionId, quantity }));

  return (
    <div className="grid gap-6">
      <nav aria-label="Menu sections" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {cafe.categories.map((c) => (
          <a key={c.id} href={`#order-${c.id}`} className="shrink-0 rounded-full border border-border-strong px-3 py-1.5 text-sm text-muted hover:text-fg">
            {c.name}
          </a>
        ))}
      </nav>

      {cafe.categories.map((category) => (
        <section key={category.id} id={`order-${category.id}`} aria-labelledby={`order-${category.id}-title`} className="scroll-mt-24">
          <h2 id={`order-${category.id}-title`} className="mb-3 font-display text-lg font-semibold uppercase tracking-[0.14em] text-gold">
            {category.name}
          </h2>
          <Card as="ul" className="divide-y divide-border">
            {category.items.map((item) => (
              <li key={item.id} className="grid gap-2 px-4 py-3 sm:px-5">
                <p>
                  {item.name}
                  {item.note && <span className="text-muted"> · {item.note}</span>}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {item.options.map((option) => {
                    const key = keyOf(item.id, option.id);
                    const quantity = cart[key] ?? 0;
                    const label = itemName(item.name, item.note) + (option.label ? ` ${option.label}` : "");
                    return (
                      <div key={option.id} className="flex items-center gap-3">
                        <span className="text-sm">
                          {option.label && <span className="mr-1 text-muted">{option.label}</span>}
                          <span className="text-gold-soft">{rupees(option.price)}</span>
                        </span>
                        {stationName &&
                          (quantity === 0 ? (
                            <button
                              type="button"
                              onClick={() => setQuantity(key, 1)}
                              aria-label={`Add ${label}`}
                              className="rounded-full border border-gold/50 px-3 py-1 text-sm text-gold hover:bg-gold hover:text-bg"
                            >
                              Add
                            </button>
                          ) : (
                            <Stepper label={label} quantity={quantity} onChange={(q) => setQuantity(key, q)} />
                          ))}
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </Card>
        </section>
      ))}

      {stationName && (
        <div className="sticky bottom-3 z-10">
          <Card className={cn("grid gap-3 border-gold/40 bg-bg/90 p-4 sm:p-5", count === 0 && !state.error && !state.notice && "hidden")}>
            <FormMessage error={state.error} notice={count === 0 ? state.notice : undefined} />
            {count > 0 && (
              <form action={action} className="grid gap-3">
                <ul className="grid max-h-48 gap-1.5 overflow-y-auto text-sm">
                  {lines.map((l) => (
                    <li key={l.key} className="flex items-baseline justify-between gap-3">
                      <span>
                        {l.quantity} × {l.label}
                      </span>
                      <span className="tabular-nums text-muted">{rupees(l.price * l.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted">Note for the kitchen (optional)</span>
                  <input
                    name="note"
                    maxLength={ORDER_LIMITS.noteLength}
                    placeholder="e.g. extra spicy, no onions"
                    className="h-10 rounded-xl border border-border-strong bg-surface/60 px-3 text-fg placeholder:text-muted/70"
                  />
                </label>
                <input type="hidden" name="cart" value={JSON.stringify(payload)} />
                <SubmitButton pendingLabel="Sending…" className="w-full">
                  Send to {stationName} · {rupees(total)}
                </SubmitButton>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
