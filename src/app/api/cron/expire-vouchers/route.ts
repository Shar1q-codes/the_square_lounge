import { isCronAuthorized } from "@/server/loyalty/cron";
import { expireOverdueVouchers } from "@/server/loyalty/vouchers";

export const dynamic = "force-dynamic";

/** Daily (netlify/functions/expire-vouchers.ts): expires overdue vouchers and refunds their points. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const expired = await expireOverdueVouchers();
  return Response.json({ expired });
}
