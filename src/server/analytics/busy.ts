import "server-only";
import { sql } from "drizzle-orm";
import { HEATMAP_HOURS, type Range } from "@/lib/analytics";
import { current, queryVisits, ts } from "./visits";

const OPEN_HOURS = new Set<number>(HEATMAP_HOURS);

/** Every whole IST hour in the range, with its business weekday (0 = Sunday) and IST hour. */
const slots = (range: Range) => sql`
  slots as (
    select t,
      extract(dow from ((t at time zone 'Asia/Kolkata') - interval '4 hours'))::int as dow,
      extract(hour from (t at time zone 'Asia/Kolkata'))::int as hour
    from generate_series(${ts(range.from)}, ${ts(range.to)} - interval '1 hour', interval '1 hour') t
  )`;

const overlaps = sql`v.started_at < s.t + interval '1 hour' and v.ended_at > s.t`;

export type HeatCell = { dow: number; hour: number; playing: number };

/**
 * Average number of members playing in each weekday × hour, over the range. A member playing half
 * an hour counts as 0.5, so the number reads as "people at the consoles, on average".
 */
export async function heatmap(range: Range): Promise<HeatCell[]> {
  const rows = await queryVisits<HeatCell>(
    ...current(range),
    sql`, ${slots(range)},
      occupancy as (
        select s.t, sum(extract(epoch from (least(v.ended_at, s.t + interval '1 hour') - greatest(v.started_at, s.t))) / 3600) as playing
        from slots s join visits v on ${overlaps}
        group by s.t
      )
      select s.dow as "dow", s.hour as "hour", round(avg(coalesce(o.playing, 0))::numeric, 2)::float8 as "playing"
      from slots s left join occupancy o on o.t = s.t
      group by s.dow, s.hour
      order by s.dow, s.hour`,
  );
  return rows.filter((c) => OPEN_HOURS.has(c.hour));
}

export type StationRow = {
  id: number;
  name: string;
  console: "PS5" | "PS4";
  visits: number;
  minutes: number;
  revenuePaise: number;
  /** Opening hours in which at least one member was checked in (two players in one hour count once). */
  busyHours: number;
  openHours: number;
};

/** Per-station use. Utilisation = busyHours ÷ openHours. */
export async function stationUse(range: Range): Promise<StationRow[]> {
  const rows = await queryVisits<Omit<StationRow, "openHours">>(
    ...current(range),
    sql`, ${slots(range)},
      busy as (
        select v.station_id, count(distinct s.t)::int as busy
        from slots s join visits v on ${overlaps}
        where s.hour not between 4 and 10
        group by v.station_id
      ),
      totals as (
        select station_id, count(*)::int as visits, sum(minutes)::int as minutes, round(sum(share))::int as revenue
        from visits group by station_id
      )
      select st.id as "id", st.name as "name", st.console as "console",
        coalesce(t.visits, 0) as "visits", coalesce(t.minutes, 0) as "minutes",
        coalesce(t.revenue, 0) as "revenuePaise", coalesce(b.busy, 0) as "busyHours"
      from stations st
      left join totals t on t.station_id = st.id
      left join busy b on b.station_id = st.id
      where st.active or t.visits is not null
      order by st.id`,
  );
  return rows.map((r) => ({ ...r, openHours: range.days * HEATMAP_HOURS.length }));
}
