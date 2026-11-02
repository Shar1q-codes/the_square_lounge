import "server-only";
import { sql } from "drizzle-orm";
import { csvRow, hourLabel, WEEKDAY_LABELS, type Range } from "@/lib/analytics";
import { istInputValue } from "@/lib/sessions";
import { writeAudit } from "@/server/identity/audit";
import { heatmap, stationUse } from "./busy";
import { loyaltySummary } from "./loyalty";
import { paymentsByMethod } from "./overview";
import { audience, byArea, byPincode, topMembers, winBackContacts } from "./people";
import { current, queryVisits } from "./visits";

export const REPORTS = [
  "visits",
  "heatmap",
  "stations",
  "areas",
  "pincodes",
  "audience",
  "top-members",
  "win-back",
  "loyalty",
  "payments",
] as const;
export type Report = (typeof REPORTS)[number];

type Cell = string | number | null;
const rupees = (paise: number | null) => (paise === null ? null : (paise / 100).toFixed(2));
const istText = (d: Date) => istInputValue(d).replace("T", " ");

async function visitRows(range: Range): Promise<Cell[][]> {
  const year = Number(range.toDate.slice(0, 4));
  const rows = await queryVisits<{
    bday: string;
    start: string;
    end: string;
    minutes: number;
    station: string;
    console: string;
    code: string;
    area: string;
    pincode: string;
    band: string;
    share: string | null;
    method: string;
  }>(
    ...current(range),
    sql`select to_char(v.bday, 'YYYY-MM-DD') as "bday",
        to_char(v.started_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') as "start",
        to_char(v.ended_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') as "end",
        v.minutes as "minutes", st.name as "station", st.console::text as "console",
        case when g.deleted_at is null then g.member_code else 'deleted' end as "code",
        initcap(trim(g.area)) as "area", g.pincode as "pincode",
        case when g.birth_year is null then 'unknown'
             when ${year} - g.birth_year < 18 then '13–17'
             when ${year} - g.birth_year < 25 then '18–24'
             when ${year} - g.birth_year < 35 then '25–34'
             else '35+' end as "band",
        case when v.amount_paise is null then null else round(v.share)::text end as "share",
        case when v.amount_paise is null then 'not recorded' else coalesce(v.method::text, 'other') end as "method"
      from visits v
      join stations st on st.id = v.station_id
      join gamers g on g.id = v.gamer_id
      order by v.started_at, 7`,
  );
  return rows.map((r) => [r.bday, r.start, r.end, r.minutes, r.station, r.console, r.code, r.area, r.pincode, r.band, rupees(r.share === null ? null : Number(r.share)), r.method]);
}

/** Header + rows for a report. Personal contact details appear only in "win-back" (opted-in members). */
async function build(report: Report, range: Range, now: Date): Promise<Cell[][]> {
  switch (report) {
    case "visits":
      return [
        ["Business day", "Start (IST)", "End (IST)", "Minutes", "Station", "Console", "Member code", "Area", "Pincode", "Age band", "Revenue share (Rs)", "Payment method"],
        ...(await visitRows(range)),
      ];
    case "heatmap":
      return [["Night of", "Hour (IST)", "Average members playing"], ...(await heatmap(range)).map((c) => [WEEKDAY_LABELS[c.dow], hourLabel(c.hour), c.playing])];
    case "stations":
      return [
        ["Station", "Console", "Visits", "Minutes", "Revenue (Rs)", "Busy hours", "Open hours", "Utilisation %"],
        ...(await stationUse(range)).map((s) => [s.name, s.console, s.visits, s.minutes, rupees(s.revenuePaise), s.busyHours, s.openHours, Math.round((s.busyHours / s.openHours) * 100)]),
      ];
    case "areas":
    case "pincodes":
      return [
        [report === "areas" ? "Area" : "Pincode", "Visits", "Members", "Revenue (Rs)"],
        ...(await (report === "areas" ? byArea : byPincode)(range)).map((r) => [r.label, r.visits, r.members, rupees(r.revenuePaise)]),
      ];
    case "audience": {
      const a = await audience(range);
      return [
        ["Group", "Value", "Visits", "Members", "Returning members"],
        ...a.ageBands.map((r) => ["Age", r.key, r.visits, r.members, null]),
        ...a.genders.map((r) => ["Gender", r.key, r.visits, r.members, null]),
        ...a.sources.map((r) => ["Sign-up source", r.key, r.visits, r.members, r.returning]),
      ];
    }
    case "top-members":
      return [["Member code", "Name", "Visits", "Minutes", "Points balance"], ...(await topMembers(range)).map((m) => [m.memberCode, m.fullName, m.visits, m.minutes, m.balance])];
    case "win-back":
      return [
        ["Name", "Email", "Mobile", "Area", "Last visit (IST)", "Total visits"],
        ...(await winBackContacts(now)).map((m) => [m.fullName, m.email, m.phone, m.area, istText(m.lastVisit), m.visits]),
      ];
    case "loyalty": {
      const l = await loyaltySummary(range);
      return [
        ["Measure", "Value"],
        ["Points earned", l.earned],
        ["Points spent", l.spent],
        ["Points refunded", l.refunded],
        ["Unspent points (all members, now)", l.outstanding],
        ["Vouchers claimed", l.claimed],
        ["Vouchers used", l.used],
        ["Vouchers expired", l.expired],
        ["Vouchers cancelled", l.cancelled],
        ...l.topOffers.map((o): Cell[] => [`Offer: ${o.title} (claimed / used)`, `${o.claimed} / ${o.used}`]),
      ];
    }
    case "payments":
      return [["Method", "Check-outs", "Visits", "Revenue (Rs)"], ...(await paymentsByMethod(range)).map((m) => [m.method, m.checkouts, m.visits, rupees(m.revenuePaise)])];
  }
}

/** Builds a CSV download and records it in the audit log. null for an unknown report name. */
export async function exportReport(adminId: string, report: string, range: Range, now = new Date()) {
  if (!(REPORTS as readonly string[]).includes(report)) return null;
  const rows = await build(report as Report, range, now);
  await writeAudit({
    actorStaffId: adminId,
    action: "analytics.export",
    targetType: "report",
    targetId: report,
    details: { report, from: range.fromDate, to: range.toDate },
  });
  // The BOM makes Excel read names and the en dash in age bands as UTF-8.
  const csv = "﻿" + rows.map(csvRow).join("\n") + "\n";
  const filename = report === "win-back" ? `square-lounge-win-back-${range.toDate}.csv` : `square-lounge-${report}-${range.fromDate}-to-${range.toDate}.csv`;
  return { filename, csv };
}
