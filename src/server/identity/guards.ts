export type Viewer = { kind: "gamer" } | { kind: "staff"; role: "staff" | "admin" } | null;
export type Need = "gamer" | "staff" | "admin";
export type Decision = { ok: true } | { ok: false; redirectTo: string };

/** Whether a viewer may see an area, and where to send them if not. */
export function authorize(viewer: Viewer, need: Need): Decision {
  if (need === "gamer") return viewer?.kind === "gamer" ? { ok: true } : { ok: false, redirectTo: "/login" };
  if (viewer?.kind !== "staff") return { ok: false, redirectTo: "/staff/login" };
  if (need === "admin" && viewer.role !== "admin") return { ok: false, redirectTo: "/staff" };
  return { ok: true };
}
