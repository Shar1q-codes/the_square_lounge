"use server";

import { randomInt } from "node:crypto";
import { z } from "zod";
import { requireStaff } from "@/server/identity/currentUser";
import { findGamers, setGamerTemporaryPassword, type GamerSummary } from "@/server/identity/gamers";

export type LookupState = { query?: string; results?: GamerSummary[]; error?: string };

export async function lookupGamers(_prev: LookupState, formData: FormData): Promise<LookupState> {
  const member = await requireStaff();
  const query = String(formData.get("q") ?? "").trim();
  if (!query) return { error: "Enter a member code, email or mobile number." };
  return { query, results: await findGamers(member.id, query) };
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
