# Tasks: `identity` module

Each task must also clear the project bar: `npm test`, `npm run lint`, `npm run typecheck` pass.

## Task 1: Tooling, database and test harness
**Description:** Add dependencies, local Postgres, Drizzle config, the identity schema, migrations (including RLS), the server-only DB client, Vitest config and an integration-test helper.
**Acceptance criteria:**
- [x] `docker compose up -d db` then `npm run db:migrate` creates all six tables on a clean DB
- [x] Every table has row-level security enabled (integration test checks `pg_class.relrowsecurity`)
- [x] `.env.example` documents every variable; `.env*` stays git-ignored
**Verification:** `npm test`, `npm run typecheck`, `npm run build`
**Dependencies:** None
**Files:** `package.json`, `docker-compose.yml`, `drizzle.config.ts`, `src/db/index.ts`, `src/db/schema/identity.ts`, `drizzle/*`, `vitest.config.ts`, `tests/integration/db.ts`, `.env.example`
**Scope:** M

## Task 2: Pure identity helpers
**Description:** Email and Indian-mobile normalisation, scrypt hash/verify, member-code generation, and shared zod schemas for sign-up, profile and staff forms.
**Acceptance criteria:**
- [x] `+91 98765 43210`, `09876543210`, `9876543210` all normalise to `+919876543210`; `5876543210` is rejected
- [x] Sign-up schema rejects under-13s, requires guardian consent under 18, rejects pincodes starting with 0
- [x] Password hashes verify, wrong passwords don't, and hashes differ for the same password
**Verification:** `npm test -- tests/unit/identity`
**Dependencies:** Task 1
**Files:** `src/server/identity/{email,phone,password,memberCode}.ts`, `src/lib/validation/identity.ts`, `tests/unit/identity/*`
**Scope:** M

## Task 3: Login sessions, lockout and role guards
**Description:** Create/read/revoke sessions with hashed tokens in cookies, failed-login lockout, and `requireGamer` / `requireStaff(role)` guards.
**Acceptance criteria:**
- [ ] Expired, revoked or deactivated-staff sessions resolve to no user
- [ ] 5 failures in 15 minutes locks the identifier; older failures don't count
- [ ] Guards redirect to the right login page for the wrong or missing role
**Verification:** `npm test -- tests/integration/identity/session`
**Dependencies:** Task 2
**Files:** `src/server/identity/{session,lockout,guards,audit}.ts`, `tests/integration/identity/session.test.ts`
**Scope:** M

### Checkpoint A: Foundation

## Task 4: Gamer sign-up (`/join`)
**Acceptance criteria:**
- [ ] Valid form creates gamer + `service` consent (+ `marketing`, `guardian` when applicable) in one transaction and logs the gamer in
- [ ] Duplicate email (any case) shows the "already has an account" message and creates nothing
- [ ] Form works at 375px wide with no horizontal scroll
**Verification:** `npm test -- tests/integration/identity/signup`; manual check in browser
**Dependencies:** Task 3
**Files:** `src/server/identity/gamers.ts`, `src/app/(gamer)/join/{page,actions}.tsx`, `src/components/account/SignUpForm.tsx`, `src/app/(gamer)/layout.tsx`
**Scope:** M

## Task 5: Gamer login and logout (`/login`)
**Acceptance criteria:**
- [ ] Correct email + password logs in; wrong details show one generic message
- [ ] Locked identifier is refused with a "try again in 15 minutes" message
- [ ] Logout revokes the session row and clears the cookie
**Verification:** `npm test -- tests/integration/identity/login`
**Dependencies:** Task 4
**Files:** `src/app/(gamer)/login/{page,actions}.tsx`, `src/components/account/LoginForm.tsx`, `src/server/identity/gamers.ts`
**Scope:** S

## Task 6: Account page (`/account`)
**Acceptance criteria:**
- [ ] Shows name, member code and a QR SVG encoding the member code
- [ ] Profile edits validate; changing email to one already used is refused
- [ ] Password change requires the current password
**Verification:** `npm test -- tests/integration/identity/profile`; manual check
**Dependencies:** Task 5
**Files:** `src/app/(gamer)/account/{page,actions}.tsx`, `src/components/account/{ProfileForm,MemberCard,PasswordForm}.tsx`
**Scope:** M

## Task 7: Privacy notice and privacy controls
**Acceptance criteria:**
- [ ] `/privacy` shows the notice and its version constant
- [ ] Marketing toggle appends a consent row each time
- [ ] Export returns JSON with profile and consents; delete (with password) scrubs personal fields, keeps area/pincode, revokes sessions, and frees the email
**Verification:** `npm test -- tests/integration/identity/privacy`
**Dependencies:** Task 6
**Files:** `src/app/(public)/privacy/page.tsx`, `src/app/(gamer)/account/privacy/{page,actions}.tsx`, `src/app/(gamer)/account/privacy/export/route.ts`, `src/server/identity/consent.ts`
**Scope:** M

### Checkpoint B: Gamer flows

## Task 8: Staff login and first-admin seed
**Acceptance criteria:**
- [ ] `npm run db:seed-admin` creates the admin once and is a no-op on re-run
- [ ] Staff login uses the same lockout; deactivated staff can't log in
**Verification:** `npm test -- tests/integration/identity/staff`
**Dependencies:** Task 3
**Files:** `scripts/seed-admin.ts`, `src/server/identity/staff.ts`, `src/app/staff/login/{page,actions}.tsx`, `src/app/staff/layout.tsx`
**Scope:** M

## Task 9: Gamer lookup and temporary password (`/staff/gamers`)
**Acceptance criteria:**
- [ ] Exact search by member code, email or mobile; shared mobile returns several gamers
- [ ] Staff can set a temporary password; gamer's existing sessions are revoked
- [ ] Each lookup and reset writes an audit row
**Verification:** `npm test -- tests/integration/identity/lookup`
**Dependencies:** Task 8
**Files:** `src/app/staff/gamers/{page,actions}.tsx`, `src/server/identity/gamers.ts`
**Scope:** S

## Task 10: Staff management (`/admin/staff`)
**Acceptance criteria:**
- [ ] Admin can create, deactivate/reactivate and reset staff; staff role gets redirected
- [ ] Admin cannot deactivate themselves
- [ ] All changes write audit rows
**Verification:** `npm test -- tests/integration/identity/staff`
**Dependencies:** Task 8
**Files:** `src/app/admin/layout.tsx`, `src/app/admin/staff/{page,actions}.tsx`, `src/server/identity/staff.ts`
**Scope:** M

## Task 11: Navbar links and e2e
**Acceptance criteria:**
- [ ] Navbar shows "Join" / "Log in" (or "My account" when logged in) without changing other sections
- [ ] Playwright: sign up → logout → login → delete; admin creates staff → staff looks up gamer
**Verification:** `npm run test:e2e`, `npm run build`
**Dependencies:** Tasks 7, 10
**Files:** `src/components/layout/Navbar.tsx`, `playwright.config.ts`, `e2e/identity.spec.ts`
**Scope:** S

### Checkpoint C: Complete
