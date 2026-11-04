import { menuItems } from "@/config/menu";

/** Limits for one station order. */
export const ORDER_LIMITS = { lines: 25, quantity: 20, noteLength: 200, openOrders: 5 } as const;

export type OrderStatus = "new" | "preparing" | "delivered" | "cancelled";

/** What the browser sends: item, option and how many. Prices never come from the browser. */
export type CartLine = { itemId: string; optionId: string; quantity: number };

/** A priced line, copied onto the order so later menu changes don't rewrite old orders. */
export type PricedLine = { itemId: string; optionId: string; name: string; option: string | null; unitPrice: number; quantity: number };

export type PriceResult =
  | { ok: true; lines: PricedLine[]; total: number }
  | { ok: false; reason: "empty" | "too_many_lines" | "unknown_item" | "bad_quantity" };

/** Display name of an item with its note, e.g. "Broasted Chicken (5 pieces)". */
export const itemName = (name: string, note?: string) => (note ? `${name} (${note})` : name);

/** Prices a cart from the menu. Repeated lines for the same item and option are merged. */
export function priceCart(cart: CartLine[]): PriceResult {
  const merged = new Map<string, CartLine>();
  for (const line of cart) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) return { ok: false, reason: "bad_quantity" };
    const key = `${line.itemId}/${line.optionId}`;
    const quantity = (merged.get(key)?.quantity ?? 0) + line.quantity;
    if (quantity > ORDER_LIMITS.quantity) return { ok: false, reason: "bad_quantity" };
    merged.set(key, { ...line, quantity });
  }
  if (merged.size === 0) return { ok: false, reason: "empty" };
  if (merged.size > ORDER_LIMITS.lines) return { ok: false, reason: "too_many_lines" };

  const lines: PricedLine[] = [];
  for (const { itemId, optionId, quantity } of merged.values()) {
    const item = menuItems.get(itemId);
    const option = item?.options.find((o) => o.id === optionId);
    if (!item || !option) return { ok: false, reason: "unknown_item" };
    lines.push({
      itemId,
      optionId,
      name: itemName(item.name, item.note),
      option: option.label || null,
      unitPrice: option.price,
      quantity,
    });
  }
  return { ok: true, lines, total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) };
}

/** Where staff can move an order next. Delivered and cancelled orders are finished. */
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  new: ["preparing", "delivered", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export const canMoveOrder = (from: OrderStatus, to: OrderStatus) => NEXT[from].includes(to);

/** Orders the kitchen still has to deal with. */
export const OPEN_STATUSES = ["new", "preparing"] as const satisfies OrderStatus[];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Order sent",
  preparing: "Being prepared",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** "₹1,240" */
export const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
