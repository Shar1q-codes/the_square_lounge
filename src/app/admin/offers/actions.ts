"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { refillValues, type FormState } from "@/lib/forms";
import { fieldErrors } from "@/lib/validation/identity";
import { offerSchema } from "@/lib/validation/loyalty";
import { requireStaff } from "@/server/identity/currentUser";
import { createOffer, updateOffer } from "@/server/loyalty/offers";

/** Creates an offer, or updates one when the form carries an `offerId`. */
export async function saveOffer(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireStaff("admin");
  const values = refillValues(formData);
  const parsed = offerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const offerId = z.uuid().safeParse(formData.get("offerId"));
  if (offerId.success) {
    const result = await updateOffer(admin.id, offerId.data, parsed.data);
    if (!result.ok) return { errors: { form: "That offer no longer exists." }, values };
  } else {
    await createOffer(admin.id, parsed.data);
  }

  revalidatePath("/admin/offers");
  revalidatePath("/shop");
  return offerId.success ? { notice: "Offer saved.", values } : { notice: `"${parsed.data.title}" is now in the shop.` };
}
