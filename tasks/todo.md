# Tasks: `loyalty` module

Every task also clears `npm test`, `npm run lint`, `npm run typecheck`. One commit per task.

## Task 1: Config, schema, helpers
- [x] `src/config/loyalty.ts` (10 pts/h PS5 and PS4, 720-min cap, 30-day vouchers)
- [x] `offers`, `vouchers`, `points_ledger` with constraints and the one-award-per-session index; RLS on
- [x] `pointsFor` and voucher-code helpers with unit tests

## Task 2: Ledger and awarding
- [x] `addLedgerEntry`, `balanceOf`, `ledgerFor`
- [x] Check-out awards points to every member checked out (same transaction); voided earns nothing; under 6 min writes nothing
- [x] Corrections write the difference as a correction entry; no double award

### Checkpoint A ✅ (204 tests, build clean, fresh DB 12/12 tables with RLS)

## Task 3: Offers and `/admin/offers`
- [x] Create, edit, hide (no delete in v1, so claimed vouchers always keep their offer), audited
- [x] `listShopOffers` returns only active, in-date, in-stock offers

## Task 4: Shop, claims, vouchers
- [ ] `/shop` public list; claim when logged in; refusals: points, stock, dates, inactive, member limit; parallel claims can't oversell
- [ ] `/account/vouchers` with code + QR, cancel and refund; `/account/points` history; balance on `/account`

## Task 5: Counter, expiry, adjustments
- [ ] `/staff/vouchers` check and mark used (once), audited
- [ ] Expiry refunds (lazy + `/api/cron/expire-vouchers` with `CRON_SECRET`, `vercel.json`)
- [ ] Admin points adjustment on `/staff/gamers`; staff see balance; export includes ledger and vouchers; deletion cancels vouchers

### Checkpoint B

## Task 6: E2E and gate
- [ ] Offer → earn → claim → redeem in Playwright; README; full gate
