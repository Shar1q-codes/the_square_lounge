# Implementation Plan: `play-sessions` module

Spec: [SPEC-play-sessions.md](../SPEC-play-sessions.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Previous module: [identity](identity/plan.md)

## Overview

Staff check members in and out of stations from a live board; each check-out records a payment; mistakes are voided (staff, 15 min) or corrected (admin, audited); gamers see "Now playing" and recent visits. Built on branch `feat/play-sessions`, stacked on `feat/identity`.

## Architecture Decisions

- **Database clock for all times** (`now()` in SQL), so counter devices with wrong clocks can't skew durations. Domain functions still accept `now` for tests where the rule is time-based (void window), comparing against DB-stored times.
- **One open session per gamer** enforced by a partial unique index; **station capacity** enforced inside a transaction holding `SELECT … FOR UPDATE` on the station row.
- **Check-out returns closed sessions** (`closeSessions()`), the hook `loyalty` will use to award points in the same transaction.
- **Stations live in the DB, seeded from `site.ts`** (`npm run db:seed`, upsert by id). New optional `maxCheckIns` per station, default 8, separate from the marketing `maxPlayers`.
- **Board freshness:** server-rendered board + client `router.refresh()` every 30 s; per-player timers tick client-side from `startedAt`.
- **Money in paise** (`integer`), parsed from rupee input by a pure helper.

## Task List

See [todo.md](todo.md).

### Phase 1: Foundation
- [x] Task 1: Schema, migration (RLS), `maxCheckIns`, `db:seed`
- [x] Task 2: Pure helpers and validation (minutes, rupees→paise, void window, zod)

### Checkpoint A
- [x] Tests, lint, typecheck, build pass; fresh DB migrates with RLS on all 9 tables

### Phase 2: Counter flows
- [ ] Task 3: Check-in domain (refusals, capacity lock, concurrency)
- [ ] Task 4: Check-out (single / station), payments, void, `closeSessions()`
- [ ] Task 5: Station board UI: check-in, check-out, void, scan button

### Checkpoint B
- [ ] Browser: check in 2 members → live timers → check out station with payment

### Phase 3: Admin and gamer views
- [ ] Task 6: Admin corrections (`/admin/sessions`)
- [ ] Task 7: Gamer "Now playing", recent visits, export includes sessions
- [ ] Task 8: E2E and full gate

### Checkpoint C
- [ ] All 10 acceptance criteria covered; full command set green

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Two counters fill the last seat at once | Med | Row lock on station + integration test running both in parallel |
| Forgotten check-outs inflate durations/points | Med | "Needs attention" flag after 12 h, admin correction, loyalty cap |
| Device clock drift | Low | DB `now()` for start/end |
| Board polling load | Low | 30 s refresh, one indexed query for open sessions |
