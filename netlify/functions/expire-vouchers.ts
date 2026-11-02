/**
 * Netlify Scheduled Function: once a day, asks the site to expire overdue vouchers and refund their
 * points. Netlify sets URL (the site's main address); CRON_SECRET must be set in the site's
 * environment variables. Vouchers also expire whenever they're viewed or redeemed, so this is a
 * safety net, not the only path.
 */
export default async function expireVouchers(): Promise<Response> {
  const site = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!site || !secret) {
    console.error("expire-vouchers: set URL and CRON_SECRET in Netlify's environment variables.");
    return new Response("Not configured", { status: 500 });
  }

  const response = await fetch(`${site}/api/cron/expire-vouchers`, { headers: { authorization: `Bearer ${secret}` } });
  const body = await response.text();
  console.log(`expire-vouchers: ${response.status} ${body}`);
  return new Response(body, { status: response.status });
}

/** 20:30 UTC = 2:00 am IST, after closing. Netlify schedules are in UTC. */
export const config = { schedule: "30 20 * * *" };
