"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fieldErrors } from "@/lib/validation/identity";
import { checkInSchema, checkOutSchema, gameField, voidSchema } from "@/lib/validation/sessions";
import { formatDuration, formatRupees, istTime } from "@/lib/sessions";
import { requireStaff } from "@/server/identity/currentUser";
import { findGamers } from "@/server/identity/gamers";
import { checkIn } from "@/server/sessions/checkIn";
import { closeSessions, voidSession } from "@/server/sessions/checkOut";

export type CheckInState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Several members share the mobile number that was searched: staff pick one. */
  choices?: { gamerId: string; fullName: string | null; memberCode: string }[];
  stationId?: string;
  /** Kept when staff have to pick between members, so the game isn't lost. */
  game?: string;
};

export async function checkInAction(_prev: CheckInState, formData: FormData): Promise<CheckInState> {
  const member = await requireStaff();
  const stationId = String(formData.get("stationId") ?? "");
  const chosen = z.uuid().safeParse(formData.get("gamerId"));

  let gamerId: string;
  if (chosen.success) {
    gamerId = chosen.data;
  } else {
    const parsed = checkInSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error), stationId };
    const found = await findGamers(member.id, parsed.data.query);
    if (found.length === 0) return { errors: { query: "No member found. Check the code, email or mobile." }, stationId };
    if (found.length > 1) {
      return {
        stationId,
        game: String(formData.get("game") ?? ""),
        choices: found.map((g) => ({ gamerId: g.id, fullName: g.fullName, memberCode: g.memberCode })),
        message: "Several members share this number. Who is checking in?",
      };
    }
    gamerId = found[0].id;
  }

  const station = z.coerce.number().int().positive().safeParse(stationId);
  if (!station.success) return { errors: { stationId: "Pick a station." }, stationId };

  const result = await checkIn(member.id, gamerId, station.data, gameField.parse(formData.get("game")));
  if (!result.ok) {
    const message = {
      already_playing:
        result.reason === "already_playing" ? `Already playing at ${result.stationName} since ${istTime(result.startedAt)}.` : "",
      station_full: "That station is full. Pick another one.",
      station_inactive: "That station isn't available.",
      gamer_not_found: "That member account no longer exists.",
    }[result.reason];
    return { errors: { form: message }, stationId };
  }

  revalidatePath("/staff");
  return { ok: true, message: `${result.fullName ?? "Member"} checked in.`, stationId };
}

export type RowActionState = { ok?: boolean; message?: string; error?: string };

export async function checkOutAction(_prev: RowActionState, formData: FormData): Promise<RowActionState> {
  const member = await requireStaff();
  const parsed = checkOutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: fieldErrors(parsed.error).amount ?? "Check the amount and try again." };

  const result = await closeSessions(member.id, parsed.data.target, {
    amountPaise: parsed.data.amountPaise,
    method: parsed.data.method,
  });
  if (!result.ok) return { error: "Already checked out." };

  revalidatePath("/staff");
  const players = result.sessions.length;
  const longest = Math.max(...result.sessions.map((s) => s.minutes));
  const paid = parsed.data.amountPaise === null ? "no amount recorded" : formatRupees(parsed.data.amountPaise);
  return {
    ok: true,
    message: `Checked out ${players === 1 ? "1 player" : `${players} players`} · ${formatDuration(longest)} · ${paid}`,
  };
}

export async function voidAction(_prev: RowActionState, formData: FormData): Promise<RowActionState> {
  const member = await requireStaff();
  const parsed = voidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: fieldErrors(parsed.error).reason ?? "Give a reason." };

  const result = await voidSession(member.id, parsed.data.sessionId, parsed.data.reason);
  if (!result.ok) {
    return { error: result.reason === "too_late" ? "It's been over 15 minutes. Ask an admin to correct it." : "Already closed." };
  }
  revalidatePath("/staff");
  return { ok: true, message: "Check-in cancelled." };
}
