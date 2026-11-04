"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/server/identity/currentUser";
import { moveOrder } from "@/server/orders/orders";

const moveSchema = z.object({ orderId: z.uuid(), to: z.enum(["preparing", "delivered", "cancelled"]) });

export async function moveOrderAction(formData: FormData): Promise<void> {
  const member = await requireStaff();
  const parsed = moveSchema.safeParse(Object.fromEntries(formData));
  if (parsed.success) await moveOrder(member.id, parsed.data.orderId, parsed.data.to);
  revalidatePath("/staff/orders");
}
