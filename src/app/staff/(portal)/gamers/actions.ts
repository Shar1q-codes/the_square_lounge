"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fieldErrors } from "@/lib/validation/identity";
import { adjustmentSchema } from "@/lib/validation/loyalty";
import { requireStaff } from "@/server/identity/currentUser";
import { findGamers, setGamerTemporaryPassword, type GamerSummary } from "@/server/identity/gamers";
import { adjustPoints } from "@/server/loyalty/adjust";
import { balanceOf } from "@/server/loyalty/ledger";

export type LookupResult = GamerSummary & { balance: number };
export type LookupState = { query?: string; results?: LookupResult[]; error?: string };

export async function lookupGamers(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const member = await requireStaff();
  const query = String(formData.get("q") ?? "").trim();
  if (!query) return { error: "Enter a member code, email or mobile number." };
  const found = await findGamers(member.id, query);
  const results = await Promise.all(found.map(async (g) => ({ ...g, balance: await balanceOf(g.id) })));
  return { query, results };
}

export type TempPasswordState = { gamerId?: string; password?: string; error?: string };

const TEMP_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export async function issueTemporaryPassword(_prev: TempPasswordState, formData: FormData): Promise<TempPasswordState> {
  const member = await requireStaff();
  const gamerId = z.uuid().safeParse(formData.get("gamerId"));
  if (!gamerId.success) return { error: "Something went wrong. Search again." };

  const password = Array.from({ length: 10 }, () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join("");
  await setGamerTemporaryPassword(member.id, gamerId.data, password);
  // Shown once to staff to read out; the gamer should change it from their account page.
  return { gamerId: gamerId.data, password };
}

export type AdjustState = { balance?: number; notice?: string; errors?: Record<string, string> };

export async function adjustPointsAction(_prev: AdjustState, formData: FormData): Promise<AdjustState> {
  const admin = await requireStaff("admin");
  const parsed = adjustmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const result = await adjustPoints(admin.id, parsed.data.gamerId, parsed.data.points, parsed.data.reason);
  if (!result.ok) return { errors: { form: "That member account no longer exists." } };
  revalidatePath("/staff/gamers");
  const verb = parsed.data.points > 0 ? `Added ${parsed.data.points}` : `Removed ${Math.abs(parsed.data.points)}`;
  return { balance: result.balance, notice: `${verb} points. New balance: ${result.balance}.` };
}
