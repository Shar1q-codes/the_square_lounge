# Tasks: `play-sessions` module

Every task also clears: `npm test`, `npm run lint`, `npm run typecheck` pass. One commit per task.

## Task 1: Schema, migration, seed
- [x] `stations`, `play_sessions`, `payments` with the spec's constraints (partial unique open-per-gamer, ended/status check, ended > started, amount ≥ 0)
- [x] RLS enabled on all three (existing RLS test passes)
- [x] `site.ts` stations get optional `maxCheckIns` (default 8); `npm run db:seed` upserts stations and the first admin; re-running changes nothing
**Files:** `src/db/schema/sessions.ts`, `src/db/schema/index.ts`, `drizzle/0002_*`, `drizzle/0003_*`, `src/config/site.ts`, `scripts/seed.ts`, `package.json` · **Scope:** M

## Task 2: Pure helpers and validation
- [x] `minutesBetween` gives whole minutes, never negative
- [x] `parseRupees`: "150" → 15000, "150.50" → 15050, "" → null, "-5"/"abc"/"1.234" rejected
- [x] `canVoid` true up to and including 15 min, false after; zod schemas for check-in, check-out, void, correction
**Files:** `src/lib/sessions.ts`, `src/lib/validation/sessions.ts`, `tests/unit/sessions/*` · **Scope:** S

### Checkpoint A ✅ (148 tests, build clean, fresh DB: 9/9 tables with RLS)

## Task 3: Check-in
- [x] Refuses: already playing (with station + time), station full, station inactive, deleted/unknown gamer
- [x] An 8-seat station takes 8 and refuses the 9th; parallel check-ins for the last seat → exactly one wins
- [x] Audit `session.check_in`
**Files:** `src/server/sessions/checkIn.ts`, `tests/support/db.ts`, `tests/integration/sessions/checkIn.test.ts` · **Scope:** M

## Task 4: Check-out, payments, void
- [x] Single and whole-station check-out end with one shared payment (amount/method optional) and return closed sessions with minutes
- [x] Void with reason within 15 min; refused after; voided never reopens
- [x] Audits `session.check_out`, `session.void`
**Files:** `src/server/sessions/checkOut.ts`, `src/server/sessions/void.ts`, `tests/integration/sessions/checkOut.test.ts` · **Scope:** M

## Task 5: Station board UI
- [x] `/staff` shows each active station: players now / limit, names, codes, live minute timers, "Needs attention" after 12 h; refreshes every 30 s
- [x] Check-in dialog (code/email/mobile, scan button where supported), check-out (one / station, amount, method), void
- [x] 375 px wide with a full 8-player station: no sideways scroll
**Files:** `src/server/sessions/board.ts`, `src/app/staff/(portal)/{page,actions}.tsx`, `src/components/staff/{StationBoard,CheckInForm,CheckOutForm,ScanButton}.tsx` · **Scope:** M

### Checkpoint B ✅ (browser: loose code check-in, shared-mobile choice, already-playing refusal, whole-station check-out ₹300 UPI, 8/8 station at 375px)

## Task 6: Admin corrections
- [ ] `/admin/sessions` lists open / needs-attention / last 7 days
- [ ] Correction: end > start, not future, ≤ 24 h, reason required; audit has before/after
**Files:** `src/server/sessions/corrections.ts`, `src/app/admin/sessions/{page,actions}.tsx`, `src/components/staff/SessionCorrection.tsx`, `tests/integration/sessions/corrections.test.ts` · **Scope:** M

## Task 7: Gamer view and export
- [ ] `/account` shows Now playing and last 20 closed visits (no amounts)
- [ ] Export includes sessions; voided and other gamers' sessions excluded from history
**Files:** `src/server/sessions/history.ts`, `src/server/identity/consent.ts`, `src/components/account/{NowPlaying,RecentVisits}.tsx`, `src/app/(gamer)/account/page.tsx`, `tests/integration/sessions/history.test.ts` · **Scope:** M

## Task 8: E2E and gate
- [ ] Staff checks in two members at one station → board shows both → checks out station with ₹300 UPI → gamer sees the visit
- [ ] `npm test`, `npm run test:e2e`, lint, typecheck, build all pass
**Files:** `e2e/sessions.spec.ts`, `e2e/helpers.ts`, `README.md` · **Scope:** S

### Checkpoint C
