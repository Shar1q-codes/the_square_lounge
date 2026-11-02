import type { Metadata } from "next";
import { PageTitle } from "@/components/account/AccountShell";
import { BarList } from "@/components/analytics/BarList";
import { ColumnChart } from "@/components/analytics/ColumnChart";
import { Heatmap } from "@/components/analytics/Heatmap";
import { KpiTile } from "@/components/analytics/KpiTile";
import { RangePicker } from "@/components/analytics/RangePicker";
import { DataTable, Section } from "@/components/analytics/Section";
import { pctChange, quietestHours, resolveRange, type Range } from "@/lib/analytics";
import { formatDuration, formatRupees, istDateTime } from "@/lib/sessions";
import { requireStaff } from "@/server/identity/currentUser";
import { heatmap, stationUse } from "@/server/analytics/busy";
import { loyaltySummary } from "@/server/analytics/loyalty";
import { dailyTrend, overview, paymentsByMethod } from "@/server/analytics/overview";
import { audience, byArea, byPincode, topMembers, WIN_BACK_DAYS, winBack } from "@/server/analytics/people";

export const metadata: Metadata = { title: "Analytics | The Square Lounge" };

const rupees = (paise: number) => formatRupees(paise);
const hours = (minutes: number) => `${(minutes / 60).toFixed(minutes < 600 ? 1 : 0)} h`;
const members = (n: number) => `${n} member${n === 1 ? "" : "s"}`;
const percent = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "–");
const day = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

const AGE_LABEL: Record<string, string> = { "13–17": "13–17", "18–24": "18–24", "25–34": "25–34", "35+": "35+", unknown: "Not given" };
const GENDER_LABEL: Record<string, string> = { male: "Male", female: "Female", other: "Other", prefer_not: "Prefer not to say", unknown: "Not given" };
const SOURCE_LABEL: Record<string, string> = {
  instagram: "Instagram",
  google: "Google / Maps",
  friend: "A friend",
  walk_in: "Walked past",
  whatsapp: "WhatsApp",
  other: "Other",
};
const METHOD_LABEL: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", other: "Other", not_recorded: "Not recorded" };

const exportHref = (report: string, range: Range) =>
  `/admin/analytics/export/${report}?${range.key === "custom" ? `range=custom&from=${range.fromDate}&to=${range.toDate}` : `range=${range.key}`}`;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  await requireStaff("admin");
  const range = resolveRange(await searchParams);

  const [stats, trend, methods, grid, stations, areas, pincodes, people, top, lapsed, loyalty] = await Promise.all([
    overview(range),
    dailyTrend(range),
    paymentsByMethod(range),
    heatmap(range),
    stationUse(range),
    byArea(range),
    byPincode(range),
    audience(range),
    topMembers(range),
    winBack(),
    loyaltySummary(range),
  ]);
  const now = stats.current;
  const before = stats.previous;
  const perVisit = (s: typeof now) => (s.visits ? s.revenuePaise / s.visits : 0);
  const avgLength = (s: typeof now) => (s.visits ? s.minutes / s.visits : 0);
  const repeatRate = (s: typeof now) => (s.members ? (s.repeatMembers / s.members) * 100 : 0);
  const unrecorded = (s: typeof now) => (s.checkouts ? (s.unrecordedCheckouts / s.checkouts) * 100 : 0);
  const labelEvery = trend.length > 31 ? 14 : trend.length > 10 ? 7 : 1;

  return (
    <div className="grid gap-6">
      <PageTitle eyebrow="Admin" title="Analytics">
        {day(range.fromDate)} – {day(range.toDate)} ({range.days} days). A day runs 4 am to 4 am, so late-night play counts
        towards the evening it started.
      </PageTitle>
      <RangePicker range={range} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiTile label="Revenue" value={rupees(now.revenuePaise)} change={pctChange(now.revenuePaise, before.revenuePaise)} />
        <KpiTile label="Visits" value={String(now.visits)} change={pctChange(now.visits, before.visits)} />
        <KpiTile label="Members who visited" value={String(now.members)} change={pctChange(now.members, before.members)} />
        <KpiTile label="Hours played" value={hours(now.minutes)} change={pctChange(now.minutes, before.minutes)} />
        <KpiTile label="New sign-ups" value={String(now.newMembers)} change={pctChange(now.newMembers, before.newMembers)} />
        <KpiTile label="Repeat rate" value={`${Math.round(repeatRate(now))}%`} change={pctChange(Math.round(repeatRate(now)), Math.round(repeatRate(before)))} note="Members with 2+ visits" />
        <KpiTile label="Average visit" value={formatDuration(Math.round(avgLength(now)))} change={pctChange(Math.round(avgLength(now)), Math.round(avgLength(before)))} />
        <KpiTile label="Spend per visit" value={rupees(Math.round(perVisit(now)))} change={pctChange(Math.round(perVisit(now)), Math.round(perVisit(before)))} />
        <KpiTile label="No amount recorded" value={`${Math.round(unrecorded(now))}%`} change={pctChange(Math.round(unrecorded(now)), Math.round(unrecorded(before)))} lowerIsBetter note="Of check-outs" />
        <KpiTile label="Unspent points" value={loyalty.outstanding.toLocaleString("en-IN")} note="Rewards members can still claim" />
      </div>

      <Section title="Daily trend" csv={exportHref("visits", range)} intro="Visits and revenue per day, as two charts so each has its own scale.">
        <div className="grid gap-6 md:grid-cols-2">
          <ColumnChart
            title="Visits"
            labelEvery={labelEvery}
            columns={trend.map((d) => ({ key: d.date, label: day(d.date), value: d.visits, display: `${d.visits} visits` }))}
          />
          <ColumnChart
            title="Revenue"
            labelEvery={labelEvery}
            columns={trend.map((d) => ({ key: d.date, label: day(d.date), value: d.revenuePaise, display: rupees(d.revenuePaise) }))}
          />
        </div>
      </Section>

      <Section title="When it's busy" csv={exportHref("heatmap", range)}>
        <Heatmap cells={grid} quiet={quietestHours(grid)} />
      </Section>

      <Section title="Stations" csv={exportHref("stations", range)} intro="Utilisation = opening hours in which at least one member was playing.">
        <DataTable
          head={["Station", "Visits", "Hours", "Revenue", "Utilisation"]}
          rows={stations.map((s) => [`${s.name} · ${s.console}`, s.visits, hours(s.minutes), rupees(s.revenuePaise), percent(s.busyHours, s.openHours)])}
        />
        <BarList
          rows={(["PS5", "PS4"] as const).map((c) => {
            const mine = stations.filter((s) => s.console === c);
            const minutes = mine.reduce((sum, s) => sum + s.minutes, 0);
            return { label: c, value: minutes, display: hours(minutes), detail: `${mine.reduce((sum, s) => sum + s.visits, 0)} visits` };
          })}
        />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Areas" csv={exportHref("areas", range)}>
          <BarList rows={areas.map((a) => ({ label: a.label, value: a.visits, display: `${a.visits} visits`, detail: `${members(a.members)} · ${rupees(a.revenuePaise)}` }))} />
        </Section>
        <Section title="Pincodes" csv={exportHref("pincodes", range)}>
          <BarList rows={pincodes.map((a) => ({ label: a.label, value: a.visits, display: `${a.visits} visits`, detail: `${members(a.members)}` }))} />
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Age" csv={exportHref("audience", range)}>
          <BarList rows={people.ageBands.map((r) => ({ label: AGE_LABEL[r.key], value: r.visits, display: `${r.visits} visits`, detail: `${members(r.members)}` }))} />
        </Section>
        <Section title="Gender">
          <BarList rows={people.genders.filter((r) => r.members > 0).map((r) => ({ label: GENDER_LABEL[r.key], value: r.visits, display: `${r.visits} visits`, detail: `${members(r.members)}` }))} />
        </Section>
        <Section title="How they found us" intro="Members who visited, and how many have come back more than once.">
          <BarList
            rows={people.sources
              .filter((r) => r.members > 0)
              .map((r) => ({ label: SOURCE_LABEL[r.key], value: r.members, display: members(r.members), detail: `${r.returning} returning` }))}
          />
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Top members" csv={exportHref("top-members", range)}>
          <DataTable
            head={["Member", "Visits", "Hours", "Points"]}
            rows={top.map((m) => [`${m.fullName ?? "Member"} (${m.memberCode})`, m.visits, hours(m.minutes), m.balance])}
          />
        </Section>
        <Section
          title={`Win back (${lapsed.count})`}
          csv="/admin/analytics/export/win-back"
          intro={`Regulars (2+ visits) with no visit in the last ${WIN_BACK_DAYS} days. The download only includes members who agreed to offers.`}
        >
          <DataTable
            head={["Member", "Visits", "Last visit", "Offers OK"]}
            rows={lapsed.rows.map((m) => [`${m.fullName ?? "Member"} (${m.memberCode})`, m.visits, istDateTime(m.lastVisit), m.optedIn ? "Yes" : "No"])}
          />
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Points shop" csv={exportHref("loyalty", range)}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiTile label="Points earned" value={loyalty.earned.toLocaleString("en-IN")} />
            <KpiTile label="Points spent" value={loyalty.spent.toLocaleString("en-IN")} />
            <KpiTile label="Vouchers claimed" value={String(loyalty.claimed)} />
            <KpiTile label="Used" value={percent(loyalty.used, loyalty.claimed)} note={`${loyalty.expired} expired`} />
          </div>
          <BarList
            empty="No vouchers claimed in this period."
            rows={loyalty.topOffers.map((o) => ({ label: o.title, value: o.claimed, display: `${o.claimed} claimed`, detail: `${o.used} used` }))}
          />
        </Section>
        <Section title="Payments" csv={exportHref("payments", range)}>
          <BarList
            rows={methods.map((m) => ({
              label: METHOD_LABEL[m.method],
              value: m.method === "not_recorded" ? m.checkouts : m.revenuePaise,
              display: m.method === "not_recorded" ? `${m.checkouts} check-outs` : rupees(m.revenuePaise),
              detail: `${m.visits} visits`,
            }))}
          />
        </Section>
      </div>
    </div>
  );
}
