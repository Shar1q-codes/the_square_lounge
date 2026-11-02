"use server";

import { redirect } from "next/navigation";
import { fieldErrors, signUpSchema } from "@/lib/validation/identity";
import { refillValues, venueYear, type FormState } from "@/lib/forms";
import { startGamerSession } from "@/server/identity/currentUser";
import { registerGamer } from "@/server/identity/gamers";

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = refillValues(formData, ["password"]);
  const parsed = signUpSchema(venueYear()).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const result = await registerGamer(parsed.data);
  if (!result.ok) {
    return { errors: { email: "This email already has an account. Log in instead." }, values };
  }

  await startGamerSession(result.gamer.id);
  redirect("/account");
}
