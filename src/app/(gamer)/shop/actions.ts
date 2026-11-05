"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireGamer } from "@/server/identity/currentUser";
import { claimOffer } from "@/server/loyalty/vouchers";

export type ClaimState = { error?: string };

export async function claimAction(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const gamer = await requireGamer();
  const offerId = z.uuid().safeParse(formData.get("offerId"));
  if (!offerId.success) return { error: "Something went wrong. Refresh and try again." };

  const result = await claimOffer(gamer.id, offerId.data);
  if (!result.ok) {
    return {
      error: {
        not_enough_points: result.reason === "not_enough_points" ? `You need ${result.shortBy} more Lounge Points.` : "",
        unavailable: "This offer isn't available any more.",
        sold_out: "Sorry, this offer just sold out.",
        limit_reached: "You've already claimed the maximum for this offer.",
        gamer_not_found: "Please log in again.",
      }[result.reason],
    };
  }

  revalidatePath("/shop");
  revalidatePath("/account");
  redirect(`/account/vouchers?new=${encodeURIComponent(result.code)}`);
}
