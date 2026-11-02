# Implementation Plan: `loyalty` module

Spec: [SPEC-loyalty.md](../SPEC-loyalty.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md) · Previous: [play-sessions](play-sessions/plan.md)

Approved 2026-11-03 with the spec's defaults (same rate for PS5 and PS4, no pre-loaded offers). Branch `feat/loyalty`, stacked on `feat/play-sessions`.

## Architecture Decisions

- **Ledger is the only source of truth.** `addLedgerEntry(tx, entry)` is the single writer; balance = `sum(delta)`.
- **Award inside the caller's transaction:** `closeSessions()` and `correctSession()` call `awardForSessions(tx, …)`, so a check-out and its points commit together.
- **Spend under a lock:** claims lock the gamer row (`FOR UPDATE`) and the offer row, then check balance, stock and limits.
- **Expiry is lazy plus a daily cron:** `expireOverdueVouchers()` runs before vouchers are listed or redeemed, and from `/api/cron/expire-vouchers` (bearer `CRON_SECRET`).
- **Pure maths in `src/lib/loyalty.ts`** (safe for client bundles): `pointsFor`, voucher code format.

## Task List

See [todo.md](todo.md).

### Phase 1
- [x] Task 1: Config, schema, migration (RLS), pure helpers
- [x] Task 2: Ledger and awarding (check-out, corrections)

### Checkpoint A
- [x] Tests/lint/typecheck/build pass; fresh DB has RLS on all 12 tables

### Phase 2
- [x] Task 3: Offers domain and `/admin/offers`
- [ ] Task 4: Shop, claims, vouchers, points page, balance on account
- [ ] Task 5: Counter redeem, expiry (lazy + cron), admin adjustments, export/deletion

### Checkpoint B
- [ ] Browser: create offer → earn → claim → redeem

### Phase 3
- [ ] Task 6: E2E and full gate

## Risks

| Risk | Mitigation |
|------|-----------|
| Double award for a session | Partial unique index on `(session_id) where reason='session'`; corrections write the difference only |
| Two taps overspend / oversell | Row locks on gamer and offer; parallel-claim integration test |
| Cron not configured on Vercel | Lazy expiry still refunds whenever vouchers are viewed or redeemed |
