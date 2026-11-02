"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireGamer } from "@/server/identity/currentUser";
import { cancelVoucher } from "@/server/loyalty/vouchers";

export type CancelState = { ok?: boolean; error?: string };

export async function cancelVoucherAction(_prev: CancelState, formData: FormData): Promise<CancelState> {
  const gamer = await requireGamer();
  const voucherId = z.uuid().safeParse(formData.get("voucherId"));
  if (!voucherId.success) return { error: "Something went wrong." };

  const result = await cancelVoucher(gamer.id, voucherId.data);
  if (!result.ok) return { error: "This voucher can't be cancelled any more." };
  revalidatePath("/account/vouchers");
  revalidatePath("/account");
  return { ok: true };
}
