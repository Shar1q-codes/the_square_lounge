# Implementation Plan: `analytics` module

Spec: [SPEC-analytics.md](../SPEC-analytics.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Previous: [loyalty](loyalty/plan.md)

Approved 2026-11-03 (open 11:00–04:00 IST daily, lapsed = 15 days, no extra scope). Branch `feat/analytics`, stacked on `feat/loyalty`.

## Architecture Decisions

- **Business day = IST shifted back 4 hours.** One SQL expression (`bday`) used by every query, so a 01:30 visit is the previous evening.
- **Range resolution in one pure function** (`resolveRange`): presets 7/30/90 days or custom dates → `[from, to)` timestamps for business-day boundaries, plus the previous period of the same length.
- **One query per section** in `src/server/analytics/`, each returning plain rows; the page runs them in parallel.
- **Revenue share:** payment amount ÷ number of sessions on that payment, computed in a CTE.
- **Charts are hand-built SVG/CSS** following the dataviz skill (loaded before the UI task).
- **CSV:** one route `/admin/analytics/export/[report]`, formula-safe escaping, audited.

## Task List

See [todo.md](todo.md).

- [x] Task 1: Pure helpers (range, % change, CSV, heat scale)
- [x] Task 2: Overview, trend, payments (+ seeded fixture)
- [x] Task 3: Heatmap and stations
- [ ] Task 4: Areas, audience, top members, win-back, loyalty summary
- [ ] Task 5: Dashboard page and charts
- [ ] Task 6: CSV downloads, e2e, full gate

### Checkpoints
- [ ] After Task 4: every query matches hand-computed numbers on the fixture
- [ ] After Task 6: full gate green; browser check at 375 px and desktop
