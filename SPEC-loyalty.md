# Spec: `loyalty`

Module 3 of 4 in [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Depends on `identity` (gamers, staff, audit) and `play-sessions` (closed sessions, corrections). `analytics` reads its ledger and vouchers.

## Objective

Reward members for time played and bring them back: every finished session earns points automatically, members see their balance and history on the website, and spend points in a points shop on offers the owner sets up. Staff hand over the reward at the counter by checking a voucher code.

**Users**

| Who | Can do (in this module) |
|---|---|
| Visitor | browse the points shop at `/shop` (to encourage sign-ups) |
| Gamer | see balance and points history, claim offers, see and cancel their vouchers |
| Staff | check and redeem a voucher code at the counter, see a member's balance in lookup |
| Admin | create and edit offers, adjust a member's points with a reason |

## Assumptions (confirm or correct)

1. **Earning rate:** 10 points per hour, counted per minute: points = ⌊minutes × 10 ÷ 60⌋, so 1 point every 6 minutes. The rate is set per console (PS5 and PS4 both 10 to start) in `src/config/loyalty.ts`, with a 12-hour cap per session (at most 120 points). Changing the rate needs a redeploy; there's no admin screen for it in v1.
2. **Points arrive at check-out**, in the same database transaction, for every member checked out. Cancelled check-ins earn nothing.
3. **Admin corrections adjust points automatically.** If an admin closes a forgotten session or changes its times, the member's points for that session are recalculated, and the difference is added or taken away as a "correction" entry.
4. **Points don't expire** in v1.
5. **Claiming an offer** takes the points straight away and gives the member a voucher code (e.g. `V-7K2QM4`) with a QR code. Staff check it at the counter and mark it used. Unused vouchers expire after **30 days** and the points go back. Members can also cancel an unused voucher themselves for a full refund.
6. **Offers** have a title, description, points cost, category (gaming / café / other), optional stock limit, optional start and end dates, and an optional "max per member". Admins create them; nothing is pre-loaded. Suggested launch offers, at the placeholder prices of ₹100/h PS4 and ₹150/h PS5:

   | Offer | Points | Roughly |
   |---|---|---|
   | Free PS4 hour | 100 | 10 h played → 1 h free (~10% back) |
   | Free PS5 hour | 150 | 15 h played |
   | Soft drink | 30 | 3 h played |
   | Snack combo | 60 | 6 h played |
7. **The balance can't go below zero by spending.** A correction that removes points from someone who has already spent them can leave a negative balance, which is shown as-is until they earn more.
8. **Deleting an account** cancels the member's unused vouchers, and their remaining points are lost (the privacy page already says so). Ledger rows stay with the anonymised account for analytics.
9. **No sign-up bonus or referral points** in v1 (easy to add later as a new ledger reason).

## User stories and acceptance criteria

1. **Earning:** checking out a session of `m` minutes on a console with rate `r` adds ⌊min(m, 720) × r ÷ 60⌋ points to that member's ledger, linked to the session. A whole-station check-out credits every member at the station. A session of under 6 minutes earns 0 and writes no entry.
2. **Corrections:** after an admin correction, the member's total points for that session equal what the new times earn, via one "correction" entry for the difference (no entry if the difference is 0).
3. **Points page** at `/account/points` (and the balance shown on `/account` and in the header of the shop): balance, and history newest first with date, description ("Played 1 h 35 min at Station 02", "Claimed: Free PS4 hour", "Refund: voucher expired", "Adjustment: birthday gift") and ±points.
4. **Shop** at `/shop`: active, in-date, in-stock offers with cost and category. Logged-out visitors see "Join to start earning". Logged-in members see their balance and a "Claim" button that is disabled (with "You need N more points") when they can't afford it.
5. **Claim:** confirm → points taken and voucher created in one transaction, with the member's row locked so two quick taps can't overspend. Refused with a clear message if: not enough points, offer out of stock, ended, inactive, or the member's limit for this offer is reached. Stock counts every voucher except cancelled and expired ones.
6. **My vouchers** at `/account/vouchers`: active vouchers with code, QR, offer and expiry date; used/expired/cancelled ones listed below. "Cancel and refund" on active vouchers.
7. **Redeem at the counter** at `/staff/vouchers`: staff type or scan a voucher code and see the offer, the member's name and member code, status and expiry, then "Mark as used". Used, expired or cancelled vouchers are shown clearly and can't be used. Audit `voucher.redeem`.
8. **Expiry:** vouchers past their expiry date become expired with a refund entry. This runs before any voucher is shown or redeemed, and also once a day from a protected cron endpoint (`/api/cron/expire-vouchers`, called by a Netlify Scheduled Function, secret in `CRON_SECRET`), so refunds happen even if nobody looks.
9. **Admin offers** at `/admin/offers`: list, create, edit and deactivate offers. Offers with vouchers can't be deleted, only deactivated. Audit `offer.create`, `offer.update`.
10. **Admin adjustment:** on `/staff/gamers` an admin can add or remove points (whole number, non-zero, at most ±10,000) with a required reason. Staff (non-admin) see the balance only. Audit `points.adjust`.
11. **Data export and deletion:** "Download my data" adds the ledger and vouchers. Deleting an account cancels active vouchers.
12. **Access control:** every action re-checks its role; members can only see and cancel their own vouchers.

## Data model

```
offers          id uuid pk, title text, description text, points_cost int (> 0),
                category enum(gaming, cafe, other), stock int null (>= 0), max_per_gamer int null (> 0),
                starts_at null, ends_at null, active bool, created_by fk staff, created_at, updated_at
vouchers        id uuid pk, code text unique, gamer_id fk gamers, offer_id fk offers, points_spent int,
                status enum(active, used, expired, cancelled), expires_at, used_at null, used_by fk staff null,
                created_at, updated_at
points_ledger   id bigserial pk, gamer_id fk gamers, delta int (<> 0),
                reason enum(session, correction, redemption, refund, adjustment),
                session_id fk play_sessions null, voucher_id fk vouchers null,
                note text null, actor_staff_id fk staff null, created_at
                -- unique (session_id) where reason = 'session'      one award per session
                -- index (gamer_id, created_at)
```

The balance is `sum(delta)` over the member's ledger rows; no stored balance column to drift. RLS is enabled on all three tables.

## Tech Stack

No new dependencies. QR codes reuse `qrcode`. Daily expiry uses a Netlify Scheduled Function in `netlify/functions/` (changed from Vercel Cron: the site is hosted on Netlify).

## Commands

As before, with a new environment variable `CRON_SECRET` (any long random string; the scheduled function sends it as a bearer token).

## Project Structure

```
src/config/loyalty.ts                rates per console, session cap, voucher days
src/db/schema/loyalty.ts             offers, vouchers, points_ledger
drizzle/0004_loyalty.sql (+ RLS)
src/lib/loyalty.ts                   pure: pointsFor(minutes, console), voucher code format
src/server/loyalty/                  ledger.ts  award.ts  offers.ts  vouchers.ts  expiry.ts
src/server/sessions/checkOut.ts      awards points inside closeSessions()
src/server/sessions/corrections.ts   re-awards inside correctSession()
src/app/(public)/shop/page.tsx       shop (public view + claim when logged in)
src/app/(gamer)/account/points/      history
src/app/(gamer)/account/vouchers/    my vouchers
src/app/staff/(portal)/vouchers/     counter redeem
src/app/admin/offers/                offer admin
src/app/api/cron/expire-vouchers/route.ts
netlify/functions/expire-vouchers.ts daily scheduled function
tests/unit/loyalty/  tests/integration/loyalty/  e2e/loyalty.spec.ts
```

## Code Style

Same as the earlier modules. Ledger writes always go through one function so every change to points has a reason:

```ts
/** The only way points change. Positive earns, negative spends. Runs inside the caller's transaction. */
export async function addLedgerEntry(tx: Executor, entry: LedgerEntry): Promise<void> {
  // ...
}
```

## Testing Strategy

- **Unit:** `pointsFor` (0, 5, 6, 59, 60, 95, 720, 900 minutes; both consoles), voucher code format and normalisation.
- **Integration:**
  - **Earning:** single and whole-station check-out award; voided earns nothing; correction up and down (including to 0); no double award.
  - **Claims:** with exact balance; one point short; stock of 1 claimed twice in parallel (one wins); per-member limit; out-of-date offer.
  - **Vouchers:** cancel refund; redeem once only; expiry refund (lazy and cron); cron rejects a missing or wrong secret.
  - **Admin and privacy:** adjustment audit; export includes ledger and vouchers; deletion cancels vouchers.
- **E2E:** admin creates an offer → staff checks a member in and out (time shifted in the test DB) → member sees points → claims the offer → staff redeems the voucher → member sees it used.

## Boundaries

- **Always:** change points only through `addLedgerEntry`; lock the member row before spending; award points in the same transaction as check-out/correction; audit staff and admin actions.
- **Ask first:** changing the earning rate or cap, points expiry, sign-up/referral bonuses, letting staff (not just admins) adjust points.
- **Never:** store a balance column; delete ledger rows; let a member spend more points than they have; reuse a used voucher.

## Success Criteria

- All 12 acceptance criteria covered by tests; `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build` pass.
- Balance always equals the sum of the ledger (checked in tests after every scenario).
- `/shop` and `/account/vouchers` work at 375px wide.

## Open Questions

- Do you want different rates for PS5 and PS4 (e.g. PS5 earns more because it costs more)? Proposed: same rate to start.
- Which offers do you want at launch? The table above is only a suggestion; you add them yourself in `/admin/offers`.
- Should café purchases earn points later? (Needs café orders, out of scope for now.)
