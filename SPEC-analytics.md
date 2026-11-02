# Spec: `analytics`

Module 4 of 4 in [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Read-only: it adds no tables and only reads what `identity`, `play-sessions` and `loyalty` record.

## Objective

Give the owner one page that answers the questions that grow sales: **when** is the lounge busy or empty, **which** stations earn their keep, **where** members come from, **who** they are and how they found the lounge, **who** has stopped coming, and whether the points shop is bringing people back. Every number can be downloaded as a CSV for deeper work in Excel or Google Sheets.

**Users:** admins only, at `/admin/analytics`. Counter staff don't see it.

## Assumptions (confirm or correct)

1. **What counts as a visit:** a closed session, dated by the **business day** it started in. Because the lounge closes at 4 am, a business day runs 04:00 → 04:00 IST, so a 1 am Saturday visit counts as Friday night. Open sessions and cancelled check-ins are left out. A group of 4 at one station is 4 visits by 4 members.
2. **Revenue** is the sum of payments recorded at check-out, in the chosen period. When one payment covers a group, it is split equally across the group's visits so it can be broken down by area and age. Check-outs with no amount entered count as ₹0 and are shown as "not recorded" so gaps are visible.
3. **How busy a station is:** for each hour of the day, a station counts as busy if at least one member was checked in. Opening hours come from `site.hours` in `src/config/site.ts`: **every day 11:00 to 04:00 IST** (confirmed by the owner).
4. **Date range:** last 7 days (default), 30 days, 90 days, or custom dates. Each headline number also shows the change versus the previous period of the same length.
5. **Win-back list:** members who visited at least twice but not in the last **15 days**. The downloadable contact list includes **only members who opted in to marketing** (DPDP Act). Everyone else appears in totals only.
6. **Deleted accounts:** their visits and area stay in the totals; they never appear in member lists.
7. **Charts are drawn by the app itself** (simple bars, a line and a heatmap as SVG/CSS). No chart library, so the page stays fast on a phone.

## User stories and acceptance criteria

1. **Headline numbers** for the period, each with change vs the previous period: revenue, visits, unique members, hours played, average visit length, new sign-ups, **repeat rate** (share of members in the period with 2+ visits), average spend per visit, and share of check-outs with no amount recorded.
2. **Daily trend:** a line of visits and revenue per day across the period.
3. **Busy-hours heatmap:** business day of week × hour of day, columns 11:00 → 03:00 IST, shaded by the average number of members playing in that hour slot. Hovering or tapping a cell shows the exact value. Highlights the 3 quietest regular hours (candidates for happy-hour offers).
4. **Stations:** per station, visits, hours played, revenue and **utilisation** (busy hours ÷ open hours in the period), plus a PS5 vs PS4 split.
5. **Where members come from:** top 10 areas and top 10 pincodes by visits, each with unique members, revenue and share of total. Everything outside the top 10 is grouped as "Other".
6. **Who they are:** visits and members by age band (13–17, 18–24, 25–34, 35+, unknown), gender, and sign-up source (Instagram, Google, friend…). The sign-up source also shows how many of those members came back for a 2nd visit, which shows which channel brings regulars.
7. **Top members:** the 10 members with the most hours in the period (name, member code, visits, hours, points balance).
8. **Win-back:** the number of lapsed members (assumption 5), with a list of up to 50 (name, member code, last visit, total visits, opted in yes/no) and a **CSV of opted-in members only** (name, email, mobile, area, last visit, total visits).
9. **Loyalty:** points earned and spent in the period, points currently unspent (outstanding), vouchers claimed vs used vs expired, redemption rate, and the most-claimed offers.
10. **Payments:** revenue by method (cash, UPI, card, other, not recorded).
11. **CSV downloads:** visits for the period (date, start, end, minutes, station, console, member code, area, pincode, age band, revenue share, payment method), plus each table above. Each download is audited (`analytics.export`, with which file and which dates). Personal contact details appear only in the win-back download.
12. **Access and speed:** only admins can open the page or downloads (others are redirected). The page loads in under 2 seconds with a year of data at expected volume (about 50,000 visits). The date range is in the URL (dates only, no personal data) so a view can be bookmarked. Usable on a phone: sections stack, tables scroll inside their own box.

## How it is computed

- Each section is one SQL query in `src/server/analytics/`. All grouping uses the business day: `(start time AT TIME ZONE 'Asia/Kolkata') - interval '4 hours'`, then its date and weekday.
- Busy hours use `generate_series` over the hours in the period, joined to sessions that overlap each hour.
- No new tables or migrations. If the page gets slow later, a nightly summary table can be added without changing the page.

## Tech Stack

No new dependencies. Charts are server-rendered SVG/HTML following the dataviz guidance (accessible colours that work in both themes, labelled axes, values on hover).

## Project Structure

```
src/server/analytics/      range.ts  overview.ts  trend.ts  heatmap.ts  stations.ts  geography.ts
                           audience.ts  members.ts  loyalty.ts  payments.ts  csv.ts
src/lib/analytics.ts       pure: date ranges (IST), % change, CSV escaping, heat scale
src/app/admin/analytics/   page.tsx, export/[report]/route.ts
src/components/analytics/  KpiTiles, TrendChart, Heatmap, BarList, DataTable, RangePicker
tests/unit/analytics/  tests/integration/analytics/  e2e/analytics.spec.ts
```

## Code Style

Same as the other modules. Each query function takes a resolved range and returns plain rows:

```ts
export type Range = { from: Date; to: Date; previousFrom: Date; previousTo: Date; days: number };

/** Visits, revenue and members per area, top 10 plus "Other". */
export async function byArea(range: Range): Promise<AreaRow[]> {
  // ...
}
```

## Testing Strategy

- **Unit:** range resolution in IST (including a custom range across midnight), % change (including from 0), CSV escaping (commas, quotes, newlines, leading `=`/`+`/`-`/`@` so Excel doesn't run formulas), heat scale.
- **Integration (seeded known data):**
  - **Totals and splits:** every headline number checked against hand-computed values; group payment split; voided and open sessions excluded.
  - **Time:** business-day boundaries (a 01:30 IST Saturday visit counts as Friday, a 04:30 one as Saturday); heatmap counts overlapping sessions in each hour they cover; utilisation with two players on one station counts the hour once.
  - **Members:** win-back rules and the opted-in-only CSV; deleted members absent from lists but present in totals; top-10 + Other.
- **E2E:** admin opens the dashboard → switches range → downloads the visits CSV; a staff member is redirected away.

## Boundaries

- **Always:** admin-only; aggregate by default; audit every download; neutralise spreadsheet formulas in CSVs; IST everywhere.
- **Ask first:** adding a chart library; nightly summary tables; showing analytics to non-admin staff; any new personal data in downloads.
- **Never:** write to any table except the audit log; put personal data in URLs; include non-opted-in members' contact details in any export.

## Success Criteria

- All 12 acceptance criteria covered by tests; `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build` pass.
- Headline numbers match a hand-checked seeded data set exactly.
- The page works at 375px wide with no sideways scrolling outside table boxes.

## Open Questions

None. Answered 2026-11-03: open 11:00–04:00 IST every day; lapsed = no visit in 15 days; scope stays as written (café sales, games played etc. are future work).
