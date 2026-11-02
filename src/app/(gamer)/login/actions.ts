"use server";

import { redirect } from "next/navigation";
import { fieldErrors, gamerLoginSchema } from "@/lib/validation/identity";
import { refillValues, type FormState } from "@/lib/forms";
import { endGamerSession, startGamerSession } from "@/server/identity/currentUser";
import { verifyGamerLogin } from "@/server/identity/gamers";

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = refillValues(formData, ["password"]);
  const parsed = gamerLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const result = await verifyGamerLogin(parsed.data.email, parsed.data.password);
  if (!result.ok) {
    const form =
      result.reason === "locked"
        ? "Too many attempts. Please try again in 15 minutes."
        : "That email and password don't match.";
    return { errors: { form }, values };
  }

  await startGamerSession(result.gamerId);
  redirect("/account");
}

export async function logOut() {
  await endGamerSession();
  redirect("/login");
}
