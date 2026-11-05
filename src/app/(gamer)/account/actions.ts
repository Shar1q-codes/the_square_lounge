"use server";

import { revalidatePath } from "next/cache";
import { changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validation/identity";
import { refillValues, venueYear, type FormState } from "@/lib/forms";
import { requireGamer, startGamerSession } from "@/server/identity/currentUser";
import { changeGamerPassword, updateGamerProfile } from "@/server/identity/gamers";
import { gameField } from "@/lib/validation/sessions";
import { setMyGame } from "@/server/sessions/live";

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const gamer = await requireGamer();
  const values = refillValues(formData);
  const year = venueYear();
  const parsed = profileSchema(year).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const result = await updateGamerProfile(gamer.id, parsed.data, year);
  if (!result.ok) {
    return result.reason === "email_taken"
      ? { errors: { email: "Another account already uses this email." }, values }
      : { errors: { birthYear: "For under-18s, please ask at the counter so a parent or guardian can agree." }, values };
  }

  revalidatePath("/account");
  return { notice: "Profile saved.", values };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const gamer = await requireGamer();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await changeGamerPassword(gamer.id, parsed.data.currentPassword, parsed.data.newPassword);
  if (!result.ok) return { errors: { currentPassword: "That isn't your current password." } };

  // Every session was signed out, including this one; keep this device logged in.
  await startGamerSession(gamer.id);
  return { notice: "Password changed. Other devices have been logged out." };
}

/** "What are you playing?" on the account page while checked in. */
export async function setGameAction(formData: FormData): Promise<void> {
  const gamer = await requireGamer();
  await setMyGame(gamer.id, gameField.parse(formData.get("game")));
  revalidatePath("/account");
}
