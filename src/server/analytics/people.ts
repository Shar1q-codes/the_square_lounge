import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { Range } from "@/lib/analytics";
import { GENDERS, REFERRAL_SOURCES } from "@/lib/validation/identity";
import { current, queryVisits, ts } from "./visits";

export const WIN_BACK_DAYS = 15;
const TOP = 10;

export type PlaceRow = { label: string; visits: number; members: number; revenuePaise: number };

/** Keeps the top 10 and folds the rest into "Other". */
function topWithOther(rows: PlaceRow[]): PlaceRow[] {
  if (rows.length <= TOP) return rows;
  const rest = rows.slice(TOP);
  const other = rest.reduce(
    (sum, r) => ({ ...sum, visits: sum.visits + r.visits, members: sum.members + r.members, revenuePaise: sum.revenuePaise + r.revenuePaise }),
    { label: "Other", visits: 0, members: 0, revenuePaise: 0 },
  );
  return [...rows.slice(0, TOP), other];
}

async function byPlace(range: Range, column: "area" | "pincode") {
  // Areas are typed by members, so "malakpet " and "Malakpet" are the same place.
  const label = column === "area" ? sql`initcap(trim(g.area))` : sql`g.pincode`;
  const rows = await queryVisits<PlaceRow>(
    ...current(range),
    sql`select ${label} as "label", count(*)::int as "visits", count(distinct v.gamer_id)::int as "members",
        coalesce(round(sum(v.share)), 0)::int as "revenuePaise"
      from visits v join gamers g on g.id = v.gamer_id
      group by 1 order by 2 desc, 1`,
  );
  return topWithOther([...rows]);
}

export const byArea = (range: Range) => byPlace(range, "area");
export const byPincode = (range: Range) => byPlace(range, "pincode");

export const AGE_BANDS = ["13–17", "18–24", "25–34", "35+", "unknown"] as const;
export type Split<K extends string> = { key: K; visits: number; members: number };
export type SourceSplit = Split<(typeof REFERRAL_SOURCES)[number]> & { returning: number };

/** Age band, gender and sign-up source of the members who visited in the range. */
export async function audience(range: Range) {
  const year = Number(range.toDate.slice(0, 4));
  const rows = await queryVisits<{ band: string; gender: string; source: string; gamer: string; visits: number; lifetime: number }>(
    ...current(range),
    sql`select
        case when g.birth_year is null then 'unknown'
             when ${year} - g.birth_year < 18 then '13–17'
             when ${year} - g.birth_year < 25 then '18–24'
             when ${year} - g.birth_year < 35 then '25–34'
             else '35+' end as "band",
        coalesce(g.gender::text, 'unknown') as "gender",
        g.referral_source::text as "source",
        g.id as "gamer",
        count(*)::int as "visits",
        (select count(*) from play_sessions x where x.gamer_id = g.id and x.status = 'closed')::int as "lifetime"
      from visits v join gamers g on g.id = v.gamer_id
      group by g.id`,
  );

  const split = <K extends string>(keys: readonly K[], keyOf: (r: (typeof rows)[number]) => string) =>
    keys.map((key) => {
      const mine = rows.filter((r) => keyOf(r) === key);
      return { key, visits: mine.reduce((s, r) => s + r.visits, 0), members: mine.length };
    });

  return {
    ageBands: split(AGE_BANDS, (r) => r.band),
    genders: split([...GENDERS, "unknown"] as const, (r) => r.gender),
    sources: split(REFERRAL_SOURCES, (r) => r.source).map((s) => ({
      ...s,
      returning: rows.filter((r) => r.source === s.key && r.lifetime >= 2).length,
    })),
  };
}

export type TopMember = { memberCode: string; fullName: string | null; visits: number; minutes: number; balance: number };

/** The 10 members with the most hours in the range. Deleted accounts never appear. */
export async function topMembers(range: Range): Promise<TopMember[]> {
  const rows = await queryVisits<TopMember>(
    ...current(range),
    sql`select g.member_code as "memberCode", g.full_name as "fullName",
        count(*)::int as "visits", sum(v.minutes)::int as "minutes",
        (select coalesce(sum(l.delta), 0) from points_ledger l where l.gamer_id = g.id)::int as "balance"
      from visits v join gamers g on g.id = v.gamer_id
      where g.deleted_at is null
      group by g.id order by 4 desc, 3 desc limit ${TOP}`,
  );
  return [...rows];
}

type LapsedRow = {
  fullName: string | null;
  memberCode: string;
  email: string | null;
  phone: string | null;
  area: string;
  optedIn: boolean;
  visits: number;
  lastVisit: Date;
};

/** Members with 2+ visits ever and none (not even an open one) in the last 15 days. */
async function lapsed(now: Date, onlyOptedIn: boolean): Promise<LapsedRow[]> {
  const rows = await db.execute<Omit<LapsedRow, "lastVisit"> & { lastVisit: string | Date }>(sql`
    with stats as (
      select gamer_id,
        count(*) filter (where status = 'closed') as visits,
        max(started_at) filter (where status <> 'voided') as last_visit
      from play_sessions group by gamer_id
    )
    select g.full_name as "fullName", g.member_code as "memberCode", g.email as "email", g.phone as "phone",
      initcap(trim(g.area)) as "area", g.marketing_opt_in as "optedIn", s.visits::int as "visits", s.last_visit as "lastVisit"
    from stats s join gamers g on g.id = s.gamer_id
    where g.deleted_at is null
      and s.visits >= 2
      and s.last_visit < ${ts(now)} - ${`${WIN_BACK_DAYS} days`}::interval
      ${onlyOptedIn ? sql`and g.marketing_opt_in` : sql``}
    order by s.last_visit desc`);
  return rows.map((r) => ({ ...r, lastVisit: new Date(r.lastVisit) }));
}

/** Count and up to 50 lapsed regulars, without contact details. */
export async function winBack(now = new Date()) {
  const rows = await lapsed(now, false);
  return {
    count: rows.length,
    rows: rows.slice(0, 50).map(({ fullName, memberCode, visits, lastVisit, optedIn }) => ({ fullName, memberCode, visits, lastVisit, optedIn })),
  };
}

/** Contact details for the win-back download: opted-in members only (DPDP). */
export async function winBackContacts(now = new Date()) {
  return (await lapsed(now, true)).map(({ fullName, email, phone, area, lastVisit, visits }) => ({ fullName, email, phone, area, lastVisit, visits }));
}
