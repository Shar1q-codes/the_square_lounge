import { currentStaff } from "@/server/identity/currentUser";
import { newOrdersSummary } from "@/server/orders/orders";

/** Polled by the staff pages every few seconds: how many new orders wait, and the newest one. */
export async function GET() {
  if (!(await currentStaff())) return Response.json({ error: "Please log in." }, { status: 401 });
  return Response.json(await newOrdersSummary(), { headers: { "Cache-Control": "no-store" } });
}
