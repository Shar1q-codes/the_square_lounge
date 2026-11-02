# Tasks: `analytics` module

Every task also clears `npm test`, `npm run lint`, `npm run typecheck`. One commit per task.

## Task 1: Pure helpers
- [x] `resolveRange` for 7/30/90/custom in business days, with previous period; bad input falls back to 7 days
- [x] `pctChange` (incl. from 0), `csvRow` (quotes, newlines, formula-safe), `heatLevel`

## Task 2: Overview, trend, payments
- [ ] Fixture with known sessions, payments, members (incl. voided, open, deleted, after-midnight)
- [ ] Headline numbers + previous period match hand-computed values; group payment split
- [ ] Daily trend fills empty days with 0; revenue by method incl. "not recorded"

## Task 3: Heatmap and stations
- [ ] Heatmap averages members playing per weekday × hour (11:00 → 03:00)
- [ ] Station visits, hours, revenue, utilisation (an hour with 2 players counts once)

## Task 4: People and loyalty
- [ ] Top-10 areas/pincodes + Other; age band, gender, sign-up source with returning share
- [ ] Top members; win-back (2+ visits, none in 15 days; deleted excluded; opted-in flag)
- [ ] Loyalty: earned, spent, outstanding, vouchers by status, top offers

## Task 5: Dashboard
- [ ] `/admin/analytics` admin-only, range picker in URL, all sections, works at 375 px

## Task 6: Downloads and gate
- [ ] CSV per report, win-back CSV opted-in only, audited
- [ ] E2E: admin views, switches range, downloads; staff redirected; full gate
