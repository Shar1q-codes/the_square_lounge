import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Range } from "@/lib/analytics";
import { current, previous, queryVisits, ts } from "./visits";

export type Stats = {
  visits: number;
  members: number;
  minutes: number;
  revenuePaise: number;
  repeatMembers: number;
  newMembers: number;
  checkouts: number;
  unrecordedCheckouts: number;
};

async function statsFor(from: Date, to: Date): Promise<Stats> {
  const [row] = await queryVisits<Omit<Stats, "newMembers">>(
    from,
    to,
    sql`select
      count(*)::int as "visits",
      count(distinct gamer_id)::int as "members",
      coalesce(sum(minutes), 0)::int as "minutes",
      coalesce(round(sum(share)), 0)::int as "revenuePaise",
      (select count(*) from (select gamer_id from visits group by gamer_id having count(*) >= 2) r)::int as "repeatMembers",
      count(distinct payment_id)::int as "checkouts",
      count(distinct payment_id) filter (where amount_paise is null)::int as "unrecordedCheckouts"
    from visits`,
  );
  const [joined] = await db.execute<{ n: number }>(
    sql`select count(*)::int as n from gamers where created_at >= ${ts(from)} and created_at < ${ts(to)}`,
  );
  return { ...row, newMembers: joined.n };
}

/** Headline numbers for the range and the previous period of the same length. */
export async function overview(range: Range): Promise<{ current: Stats; previous: Stats }> {
  const [now, before] = await Promise.all([statsFor(...current(range)), statsFor(...previous(range))]);
  return { current: now, previous: before };
}

export type TrendDay = { date: string; visits: number; revenuePaise: number };

/** Visits and revenue per business day, including days with nothing. */
export async function dailyTrend(range: Range): Promise<TrendDay[]> {
  const rows = await queryVisits<TrendDay>(
    ...current(range),
    sql`select to_char(d, 'YYYY-MM-DD') as "date",
        count(v.id)::int as "visits",
        coalesce(round(sum(v.share)), 0)::int as "revenuePaise"
      from generate_series(${range.fromDate}::date, ${range.toDate}::date, interval '1 day') d
      left join visits v on v.bday = d::date
      group by d order by d`,
  );
  return [...rows];
}

export type MethodRow = { method: "cash" | "upi" | "card" | "other" | "not_recorded"; checkouts: number; visits: number; revenuePaise: number };

/** Revenue by payment method. A check-out with no amount is "not_recorded", whatever its method. */
export async function paymentsByMethod(range: Range): Promise<MethodRow[]> {
  const rows = await queryVisits<MethodRow>(
    ...current(range),
    sql`select
        case when amount_paise is null then 'not_recorded' else coalesce(method::text, 'other') end as "method",
        count(distinct payment_id)::int as "checkouts",
        count(*)::int as "visits",
        coalesce(round(sum(share)), 0)::int as "revenuePaise"
      from visits
      group by 1
      order by (case when amount_paise is null then 'not_recorded' else coalesce(method::text, 'other') end) = 'not_recorded', 4 desc`,
  );
  return [...rows];
}
