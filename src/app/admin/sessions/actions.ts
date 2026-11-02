"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { fieldErrors } from "@/lib/validation/identity";
import { correctionSchema } from "@/lib/validation/sessions";
import { requireStaff } from "@/server/identity/currentUser";
import { correctSession } from "@/server/sessions/corrections";

export type CorrectionState = { errors?: Record<string, string> };

export async function correctSessionAction(_prev: CorrectionState, formData: FormData): Promise<CorrectionState> {
  const admin = await requireStaff("admin");
  const parsed = correctionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await correctSession(admin.id, parsed.data);
  if (!result.ok) {
    const form = {
      not_found: "That session no longer exists.",
      voided: "Cancelled check-ins can't be corrected.",
      future: "The end time can't be in the future.",
    }[result.reason];
    return { errors: { form } };
  }
  revalidatePath("/admin/sessions");
  revalidatePath("/staff");
  // The row may leave the current list (e.g. no longer "needs attention"), so confirm at page level.
  const filter = String(formData.get("filter") ?? "attention").replace(/[^a-z]/g, "");
  redirect(`/admin/sessions?filter=${filter}&saved=1`);
}
