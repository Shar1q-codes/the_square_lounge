import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Range } from "@/lib/analytics";
import { ts } from "./visits";

export type LoyaltySummary = {
  /** Points from play (sessions and corrections) and admin gifts in the range. */
  earned: number;
  /** Points spent on vouchers in the range. */
  spent: number;
  refunded: number;
  /** All unspent points held by current members (a liability: rewards still owed). */
  outstanding: number;
  claimed: number;
  used: number;
  expired: number;
  cancelled: number;
  topOffers: { title: string; claimed: number; used: number }[];
};

export async function loyaltySummary(range: Range): Promise<LoyaltySummary> {
  const from = ts(range.from);
  const to = ts(range.to);
  const [[points], [vouchers], offers] = await Promise.all([
    db.execute<{ earned: number; spent: number; refunded: number; outstanding: number }>(sql`
      select
        coalesce(sum(delta) filter (where created_at >= ${from} and created_at < ${to}
          and (reason in ('session', 'correction') or (reason = 'adjustment' and delta > 0))), 0)::int as "earned",
        coalesce(-sum(delta) filter (where created_at >= ${from} and created_at < ${to} and reason = 'redemption'), 0)::int as "spent",
        coalesce(sum(delta) filter (where created_at >= ${from} and created_at < ${to} and reason = 'refund'), 0)::int as "refunded",
        coalesce(sum(delta) filter (where gamer_id in (select id from gamers where deleted_at is null)), 0)::int as "outstanding"
      from points_ledger`),
    db.execute<{ claimed: number; used: number; expired: number; cancelled: number }>(sql`
      select count(*)::int as "claimed",
        count(*) filter (where status = 'used')::int as "used",
        count(*) filter (where status = 'expired')::int as "expired",
        count(*) filter (where status = 'cancelled')::int as "cancelled"
      from vouchers where created_at >= ${from} and created_at < ${to}`),
    db.execute<{ title: string; claimed: number; used: number }>(sql`
      select o.title as "title", count(*)::int as "claimed", count(*) filter (where v.status = 'used')::int as "used"
      from vouchers v join offers o on o.id = v.offer_id
      where v.created_at >= ${from} and v.created_at < ${to}
      group by o.id, o.title order by 2 desc, 1 limit 5`),
  ]);
  return { ...points, ...vouchers, topOffers: [...offers] };
}
