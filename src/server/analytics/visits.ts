import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import type { Range } from "@/lib/analytics";

/** A timestamp parameter. Raw SQL can't send JS Dates with prepare: false, so send ISO text and cast. */
export const ts = (date: Date) => sql`${date.toISOString()}::timestamptz`;

/** Business date (04:00 → 04:00 IST) of a timestamp column, as a SQL date. */
export const bday = (column: SQL | string) =>
  sql`((${typeof column === "string" ? sql.raw(column) : column} at time zone 'Asia/Kolkata') - interval '4 hours')::date`;

/**
 * Closed visits that started in [from, to), one row each, with whole minutes played and this visit's
 * share of its payment (a group payment is split equally). Every analytics query builds on this.
 */
export const visitsCte = (from: Date, to: Date) => sql`
  visits as (
    select
      ps.id,
      ps.gamer_id,
      ps.station_id,
      ps.started_at,
      ps.ended_at,
      ps.payment_id,
      floor(extract(epoch from (ps.ended_at - ps.started_at)) / 60)::int as minutes,
      ${bday("ps.started_at")} as bday,
      p.amount_paise,
      p.method,
      coalesce(p.amount_paise::numeric / nullif((select count(*) from play_sessions x where x.payment_id = ps.payment_id), 0), 0) as share
    from play_sessions ps
    left join payments p on p.id = ps.payment_id
    where ps.status = 'closed' and ps.started_at >= ${ts(from)} and ps.started_at < ${ts(to)}
  )`;

/** Runs a query that starts `with visits as (...)` for the given window. */
export function queryVisits<T extends Record<string, unknown>>(from: Date, to: Date, body: SQL) {
  return db.execute<T>(sql`with ${visitsCte(from, to)} ${body}`);
}

export const current = (r: Range) => [r.from, r.to] as const;
export const previous = (r: Range) => [r.previousFrom, r.previousTo] as const;
