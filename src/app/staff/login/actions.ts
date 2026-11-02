"use server";

import { redirect } from "next/navigation";
import { fieldErrors, staffLoginSchema } from "@/lib/validation/identity";
import { refillValues, type FormState } from "@/lib/forms";
import { endStaffSession, startStaffSession } from "@/server/identity/currentUser";
import { verifyStaffLogin } from "@/server/identity/staff";

export async function staffLogIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = refillValues(formData, ["password"]);
  const parsed = staffLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const result = await verifyStaffLogin(parsed.data.username, parsed.data.password);
  if (!result.ok) {
    const form =
      result.reason === "locked" ? "Too many attempts. Please try again in 15 minutes." : "Wrong username or password.";
    return { errors: { form }, values };
  }

  await startStaffSession(result.staffId);
  redirect("/staff");
}

export async function staffLogOut() {
  await endStaffSession();
  redirect("/staff/login");
}
