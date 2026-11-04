"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ORDER_LIMITS, rupees } from "@/lib/orders";
import { requireGamer } from "@/server/identity/currentUser";
import { cancelOwnOrder, placeOrder } from "@/server/orders/orders";

export type OrderState = { error?: string; notice?: string; placedAt?: number };

const cartSchema = z
  .array(
    z.object({
      itemId: z.string().max(60),
      optionId: z.string().max(30),
      quantity: z.number().int().min(1).max(ORDER_LIMITS.quantity),
    }),
  )
  .max(ORDER_LIMITS.lines);

const REASONS = {
  not_checked_in: "You need to be checked in to a station to order. Ask at the counter.",
  too_many_open: `You already have ${ORDER_LIMITS.openOrders} orders on the way. Wait for one to arrive first.`,
  empty: "Add something to your order first.",
  too_many_lines: "That's a lot! Please split it into two orders.",
  unknown_item: "Part of your order is no longer on the menu. Refresh and try again.",
  bad_quantity: `You can order up to ${ORDER_LIMITS.quantity} of each item.`,
} as const;

export async function placeOrderAction(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const gamer = await requireGamer();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    raw = null;
  }
  const cart = cartSchema.safeParse(raw);
  if (!cart.success) return { error: "Something went wrong with your order. Refresh and try again." };

  const result = await placeOrder(gamer.id, cart.data, String(formData.get("note") ?? ""));
  if (!result.ok) return { error: REASONS[result.reason] };
  revalidatePath("/order");
  return { notice: `Order sent to ${result.stationName} (${rupees(result.total)}). Pay at the counter with your gaming time.`, placedAt: Date.now() };
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const gamer = await requireGamer();
  const orderId = z.uuid().safeParse(formData.get("orderId"));
  if (orderId.success) await cancelOwnOrder(gamer.id, orderId.data);
  revalidatePath("/order");
}
