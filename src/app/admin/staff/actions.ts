"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createStaffSchema, fieldErrors } from "@/lib/validation/identity";
import { refillValues, type FormState } from "@/lib/forms";
import { requireStaff } from "@/server/identity/currentUser";
import { createStaffMember, resetStaffPassword, setStaffActive } from "@/server/identity/staff";

export async function addStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireStaff("admin");
  const values = refillValues(formData, ["password"]);
  const parsed = createStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const result = await createStaffMember(admin.id, parsed.data);
  if (!result.ok) return { errors: { username: "That username is taken." }, values };

  revalidatePath("/admin/staff");
  return { notice: `${parsed.data.displayName} can now log in as "${parsed.data.username}".` };
}

export type RowState = { error?: string; password?: string };

const staffId = z.uuid();

export async function toggleStaffActive(_prev: RowState, formData: FormData): Promise<RowState> {
  const admin = await requireStaff("admin");
  const id = staffId.safeParse(formData.get("staffId"));
  if (!id.success) return { error: "Something went wrong." };

  const result = await setStaffActive(admin.id, id.data, formData.get("active") === "true");
  if (!result.ok) return { error: "You can't deactivate your own account." };
  revalidatePath("/admin/staff");
  return {};
}

const TEMP_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export async function resetPassword(_prev: RowState, formData: FormData): Promise<RowState> {
  const admin = await requireStaff("admin");
  const id = staffId.safeParse(formData.get("staffId"));
  if (!id.success) return { error: "Something went wrong." };

  const password = Array.from({ length: 12 }, () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join("");
  await resetStaffPassword(admin.id, id.data, password);
  return { password };
}
