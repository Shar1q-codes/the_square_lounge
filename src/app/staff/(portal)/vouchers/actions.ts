"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/server/identity/currentUser";
import { findVoucherForCounter, redeemVoucher, type CounterVoucher } from "@/server/loyalty/vouchers";

export type VoucherLookupState = { query?: string; voucher?: CounterVoucher; error?: string; notice?: string };

export async function lookupVoucherAction(_prev: VoucherLookupState, formData: FormData): Promise<VoucherLookupState> {
  await requireStaff();
  const query = String(formData.get("code") ?? "").trim();
  if (!query) return { error: "Enter or scan a voucher code." };
  const voucher = await findVoucherForCounter(query);
  return voucher ? { query, voucher } : { query, error: "No voucher with that code. Check for typos." };
}

export async function redeemVoucherAction(_prev: VoucherLookupState, formData: FormData): Promise<VoucherLookupState> {
  const member = await requireStaff();
  const voucherId = z.uuid().safeParse(formData.get("voucherId"));
  const code = String(formData.get("code") ?? "");
  if (!voucherId.success) return { error: "Something went wrong. Search again." };

  const result = await redeemVoucher(member.id, voucherId.data);
  const voucher = (await findVoucherForCounter(code)) ?? undefined;
  revalidatePath("/staff/vouchers");
  if (!result.ok) return { voucher, error: `This voucher is ${result.status.replace("_", " ")} and can't be used.` };
  return { voucher, notice: `Done. Hand over: ${voucher?.offerTitle ?? "the reward"}.` };
}
