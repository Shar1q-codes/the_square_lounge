"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FormState } from "@/lib/forms";
import { deleteGamerAccount, setMarketingConsent } from "@/server/identity/consent";
import { endGamerSession, requireGamer } from "@/server/identity/currentUser";

export async function updateMarketing(_prev: FormState, formData: FormData): Promise<FormState> {
  const gamer = await requireGamer();
  const granted = formData.get("marketingOptIn") === "on";
  if (granted !== gamer.marketingOptIn) await setMarketingConsent(gamer.id, granted);
  revalidatePath("/account/privacy");
  return { notice: granted ? "You'll get offers and tournament news." : "Marketing messages are off." };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const gamer = await requireGamer();
  if (formData.get("confirm") !== "on") return { errors: { confirm: "Tick the box to confirm." } };

  const result = await deleteGamerAccount(gamer.id, String(formData.get("password") ?? ""));
  if (!result.ok) return { errors: { password: "That isn't your password." } };

  await endGamerSession();
  redirect("/?account=deleted");
}
