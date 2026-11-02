# Spec: `play-sessions`

Module 2 of 4 in [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Depends on `identity` (gamers, staff, guards, audit log). `loyalty` and `analytics` read what this module records.

## Objective

Record exactly how long each member plays, on which station, and what was paid, so `loyalty` can award points and `analytics` can show busy hours, station use and revenue. Staff do all check-ins and check-outs at the counter; gamers can't start or stop their own time.

**Users**

| Who | Can do (in this module) |
|---|---|
| Staff | see the live station board, check members in and out (one or a whole station at once), record payment, void a mistaken check-in within 15 minutes |
| Admin | everything staff can do, plus correct a session's start/end time with a reason |
| Gamer | see whether they're currently playing and their visit history on `/account` |

## Assumptions (confirm or correct)

1. **Groups:** each member at a station is checked in separately, so each earns their own points. Party games (e.g. WWE 2K26) can have 6–8 players, so each station has its own check-in limit, `maxCheckIns` in `site.ts`, **defaulting to 8**. Lower it for a station with fewer controllers. The marketing text ("Up to 4 players", from `maxPlayers`) is separate and unchanged. Friends without accounts just play; they aren't tracked. *This changes the map's "one open session per station" to "one open session per gamer; up to `maxCheckIns` per station".* *(Updated 2026-11-03 after the owner pointed out 6–8 player games.)*
2. **Payment is recorded at check-out:** one payment per check-out (a single member, or a whole station at once), with an optional amount in ₹ and method (cash / UPI / card / other). Leaving the amount blank is allowed (e.g. prepaid). No bill calculation in v1: staff type what was paid.
3. **Stations come from `src/config/site.ts`.** `npm run db:seed` copies them into a `stations` table (same ids 1–5, name, console, check-in limit). To add or change a station: edit `site.ts`, re-run the seed. No station admin screen in v1.
4. **Check-in by member code:** staff type the code, scan it with a USB/Bluetooth barcode scanner (these type like a keyboard), or tap "Scan" to use the device camera where the browser supports it (Chrome on Android). Search by email or mobile also works (reusing identity's exact lookup).
5. **No opening-hours enforcement:** check-ins are allowed any time; times are stored in UTC and shown in IST.
6. **Mistakes:** staff can void a session within 15 minutes of check-in (no points, kept for the record). Anything else (e.g. forgot to check someone out) is an admin correction with a required reason, written to the audit log.
7. **Long sessions:** a session open longer than 12 hours is shown as "Needs attention" on the board. It is not closed automatically. `loyalty` caps points at 12 hours.

## User stories and acceptance criteria

1. **Station board** at `/staff` (replaces the current welcome page): a card per active station showing console type, players now / check-in limit (up to 8, laid out so 8 names fit on a phone), and for each player their name, member code and time played so far (updates every minute without reloading). Board data refreshes every 30 seconds so several counter devices stay in sync.
2. **Check in** from the board: staff enter or scan a member code (or email/mobile), pick a station with a free seat, confirm.
   - Refused with a clear message if: the gamer already has an open session ("Already playing at Station 2 since 4:10 pm"), the station is full, the station is inactive, or the account is deleted.
   - Two staff checking the last seat in at the same moment can't both succeed (row lock on the station).
   - Writes `started_at = now()` (database clock) and the staff member who did it.
3. **Check out one member:** from their row on the board. Staff see the duration, optionally enter amount and method, confirm. Sets `ended_at = now()`, the staff member, and links a new payment.
4. **Check out a whole station:** one action ends every open session at that station with the same end time and one payment for the group.
5. **Void:** within 15 minutes of check-in, staff can void a session with a reason ("checked into the wrong station"). Voided sessions never count for points or analytics. After 15 minutes the button is gone.
6. **Admin correction** at `/admin/sessions`: list recent sessions (filter: open, needs attention, last 7 days). Admin can set start/end times (end after start, not in the future, at most 24 hours long) with a required reason; before/after values go to the audit log.
7. **Gamer view** on `/account`: a "Now playing" banner when they have an open session (station and start time), and "Recent visits" listing the last 20 closed sessions (date, station, duration). No amounts paid are shown to gamers.
8. **Data export and deletion:** "Download my data" includes the gamer's sessions (station, start, end, duration). Deleting an account keeps sessions linked to the anonymised gamer row, as the privacy notice says.
9. **Interface for `loyalty`:** `closeSessions()` returns the closed sessions (`id, gamerId, stationId, console, startedAt, endedAt, minutes`) in the same transaction, so `loyalty` can award points atomically when it's built. `minutes` = whole minutes played, never negative.
10. **Access control:** all check-in/out/void actions need a staff session; corrections need admin; every action re-checks the role and writes an audit row (`session.check_in`, `session.check_out`, `session.void`, `session.correct`).

## Data model

```
stations       id int pk (matches site.ts), name text, console enum(PS5,PS4), max_check_ins int (1–12),
               active bool, created_at, updated_at
play_sessions  id uuid pk, gamer_id fk gamers, station_id fk stations,
               status enum(open, closed, voided), started_at, ended_at null,
               started_by fk staff, ended_by fk staff null, payment_id fk payments null,
               void_reason text null, created_at, updated_at
               -- unique (gamer_id) where status = 'open'      one open session per gamer
               -- check: ended_at is null  <=>  status = 'open'; ended_at > started_at
               -- index (station_id, status), index (started_at)
payments       id uuid pk, station_id fk, amount_paise int null (>= 0), method enum(cash,upi,card,other) null,
               recorded_by fk staff, created_at
```

Amounts are stored in paise (integers) to avoid rounding errors. RLS enabled on all three tables (the existing test enforces this).

## Tech Stack

No new dependencies. Same stack as `identity`: Next.js server actions, Drizzle, zod, Vitest, Playwright. Camera scanning uses the browser's built-in `BarcodeDetector` API and only appears where it exists.

## Commands

As in `SPEC-identity.md`, plus:

```
Seed stations (and first admin): npm run db:seed
```

(`db:seed-admin` stays as an alias.)

## Project Structure

```
src/config/site.ts                   add optional maxCheckIns per station (default 8)
src/db/schema/sessions.ts            stations, play_sessions, payments
drizzle/0002_play_sessions.sql       generated + RLS lines
scripts/seed.ts                      stations from site.ts (upsert) + first admin
src/server/sessions/                 checkIn.ts  checkOut.ts  board.ts  corrections.ts  history.ts
src/lib/validation/sessions.ts       zod: check-in, check-out (amount, method), void, correction
src/app/staff/(portal)/page.tsx      station board
src/app/staff/(portal)/actions.ts    check in / out / void
src/app/admin/sessions/              list + correction form
src/components/staff/                StationBoard, CheckInDialog, CheckOutDialog, ScanButton
src/components/account/              NowPlaying, RecentVisits
tests/unit/sessions/                 duration maths, amount parsing, void window
tests/integration/sessions/          check-in rules, capacity race, check-out, void, corrections, history, export
e2e/sessions.spec.ts
```

## Code Style

Same as `identity`: domain functions in `src/server/**` return result objects for expected failures and take `now` where time matters, so tests don't sleep:

```ts
export type CheckInResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "already_playing" | "station_full" | "station_inactive" | "gamer_not_found"; detail?: string };

/** Starts a session. Locks the station row so two counters can't fill the last seat together. */
export async function checkIn(staffId: string, gamerId: string, stationId: number): Promise<CheckInResult> {
  // ...
}
```

## Testing Strategy

- **Unit:** whole-minute duration (including just under a minute = 0), rupee input → paise ("150", "150.50", "", "-5" rejected), void-window boundary at exactly 15 minutes.
- **Integration (real Postgres):** each refusal reason in criterion 2; an 8-player station accepts 8 and refuses the 9th; two concurrent check-ins for the last seat (run in parallel, exactly one wins); single and whole-station check-out share one payment and end time; void after 15 minutes refused; correction validation and audit before/after; history excludes voided and other gamers' sessions; export includes sessions; deleted gamer can't be checked in.
- **E2E:** staff checks in two members at one station → board shows both with live timers → checks out the station with ₹300 UPI → gamer's `/account` shows the visit.

## Boundaries

- **Always:** use the database clock (`now()`) for start/end; lock the station row on check-in; keep voided sessions (never delete); audit every staff action; show times in IST.
- **Ask first:** automatic check-out of long sessions; bill calculation from the price list; café orders; any change to how `identity` works.
- **Never:** let a gamer start or stop their own session; show amounts paid to gamers; hard-delete sessions or payments.

## Success Criteria

- All 10 acceptance criteria covered by tests; `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build` pass.
- A check-in takes at most 3 taps/keystrokes after scanning or typing the member code.
- The board is usable on a phone held at the counter (375px wide, no sideways scrolling), including a full 8-player station.

## Open Questions

- Should staff be able to see a gamer's previous visits when checking them in (e.g. "3rd visit this week")? Proposed: no in v1; `analytics` covers it.
- Do you want a payment method list other than cash / UPI / card / other?
