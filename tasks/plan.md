# Implementation Plan: `identity` module

Spec: [SPEC-identity.md](../SPEC-identity.md) · Map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)

## Overview

Add gamer accounts (email + password, mobile number as contact only), staff/admin logins, consent records and staff management to the existing Next.js marketing site, backed by Supabase Postgres through Drizzle. The marketing pages stay untouched apart from Join/Login links in the navbar.

## Architecture Decisions

- **App-owned auth, not Supabase Auth.** scrypt password hashes and opaque session tokens (SHA-256 hashed in `auth_sessions`). Keeps all access server-side and lets RLS stay "deny all".
- **One Drizzle client, server-only.** `src/db/index.ts` imports `server-only`; postgres.js with `prepare: false` so it works through Supabase's transaction pooler.
- **RLS enabled on every table with no policies**, done in a hand-written migration after the generated one, so Supabase's public Data API exposes nothing.
- **Domain code in `src/server/identity/` returns result objects;** server actions (`actions.ts` beside each page) validate with shared zod schemas and call the domain code. Pages never query the DB directly.
- **Route protection in server layouts** (`requireGamer()`, `requireStaff(role)`), and every server action re-checks its role. No DB calls in middleware.
- **Gamer pages use a plain layout** (no Lenis / 3D) so they stay light on phones, reusing `components/ui` (Button, Card, Container) and the existing design tokens.
- **Tests:** Vitest unit tests for pure helpers; Vitest integration tests run against a real Postgres (`TEST_DATABASE_URL`), migrated once and truncated between tests; Playwright e2e against the dev server.

## Task List

See [todo.md](todo.md) for acceptance criteria per task.

### Phase 1: Foundation
- [x] Task 1: Tooling, database and test harness
- [x] Task 2: Pure identity helpers (email, phone, password, member code, zod schemas)
- [x] Task 3: Login sessions, lockout and role guards

### Checkpoint A: Foundation
- [x] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` pass; migrations apply to a clean DB

### Phase 2: Gamer flows
- [ ] Task 4: Gamer sign-up (`/join`)
- [ ] Task 5: Gamer login and logout (`/login`)
- [ ] Task 6: Account page: profile, member QR, password change (`/account`)
- [ ] Task 7: Privacy notice, consent toggle, data export, account deletion

### Checkpoint B: Gamer flows
- [ ] Sign up → log out → log in → edit → delete works in the browser

### Phase 3: Staff and admin
- [ ] Task 8: Staff login and first-admin seed script
- [ ] Task 9: Gamer lookup and temporary password reset (`/staff/gamers`)
- [ ] Task 10: Staff management (`/admin/staff`)
- [ ] Task 11: Navbar links and Playwright e2e for the whole module

### Checkpoint C: Complete
- [ ] All 10 spec acceptance criteria covered by tests; full command set green; human review

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase pooler rejects prepared statements | High | `prepare: false` in the postgres.js client; documented in `.env.example` |
| Leaked anon key exposes data via Data API | High | RLS on, no policies; migration test asserts `relrowsecurity` on every table |
| Session fixation / cookie theft | Med | New token on every login, httpOnly+secure+sameSite=lax, server-side revoke on logout, deactivate and delete |
| Brute-force on login | Med | 5 failures / 15 min lockout per identifier, generic error message |
| Docker not available on a dev machine | Low | Any Postgres 15+ works via `DATABASE_URL`; a Supabase branch DB also works |

## Open Questions

- Privacy-notice contact email (uses `site.contact.email` placeholder until filled in).
- Inactive-account anonymisation period (proposed 3 years; not built in this module).
