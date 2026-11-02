import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Gamer, Staff } from "@/db/schema";
import { authorize } from "./guards";
import { createSession, resolveGamerSession, resolveStaffSession, revokeSession } from "./session";

// Separate cookies so a gamer can log in on the counter PC without logging staff out.
const GAMER_COOKIE = "sq_session";
const STAFF_COOKIE = "sq_staff_session";

const cookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  expires,
});

export async function startGamerSession(gamerId: string) {
  const { token, expiresAt } = await createSession({ gamerId });
  (await cookies()).set(GAMER_COOKIE, token, cookieOptions(expiresAt));
}

export async function startStaffSession(staffId: string) {
  const { token, expiresAt } = await createSession({ staffId });
  (await cookies()).set(STAFF_COOKIE, token, cookieOptions(expiresAt));
}

export async function endGamerSession() {
  const jar = await cookies();
  const token = jar.get(GAMER_COOKIE)?.value;
  if (token) await revokeSession(token);
  jar.delete(GAMER_COOKIE);
}

export async function endStaffSession() {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (token) await revokeSession(token);
  jar.delete(STAFF_COOKIE);
}

/** Cached per request, so layouts, pages and actions share one lookup. */
export const currentGamer = cache(async (): Promise<Gamer | null> =>
  resolveGamerSession((await cookies()).get(GAMER_COOKIE)?.value),
);

export const currentStaff = cache(async (): Promise<Staff | null> =>
  resolveStaffSession((await cookies()).get(STAFF_COOKIE)?.value),
);

/** For gamer pages and actions: the logged-in gamer, or a redirect to /login. */
export async function requireGamer(): Promise<Gamer> {
  const gamer = await currentGamer();
  const decision = authorize(gamer ? { kind: "gamer" } : null, "gamer");
  if (!decision.ok || !gamer) redirect(decision.ok ? "/login" : decision.redirectTo);
  return gamer;
}

/** For staff/admin pages and actions: the logged-in staff member with enough rights, or a redirect. */
export async function requireStaff(need: "staff" | "admin" = "staff"): Promise<Staff> {
  const member = await currentStaff();
  const decision = authorize(member ? { kind: "staff", role: member.role } : null, need);
  if (!decision.ok || !member) redirect(decision.ok ? "/staff/login" : decision.redirectTo);
  return member;
}
