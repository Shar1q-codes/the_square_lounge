# Spec: `identity`

Module 1 of 4 in [CAPABILITY-MAP.md](CAPABILITY-MAP.md). Provides accounts, login and consent for the other modules.

## Objective

Give every gamer at The Square Lounge a personal account so later modules can track their play time and points, and give the counter team and owners their own logins. Collect the profile data the business needs for analysis (area, pincode, age band, how they found us), with consent recorded in a way that meets India's Digital Personal Data Protection Act, 2023 (DPDP).

**Users**

| Who | Signs in with | Can do (in this module) |
|---|---|---|
| Gamer | email + password, on the website | sign up, log in/out, edit profile, see their member code and QR, change marketing consent, download their data, delete their account |
| Staff | username + password | log in/out, find a gamer by member code, email or mobile number and see a profile summary |
| Admin | username + password | everything staff can do, plus create, deactivate and reset staff accounts |

**User stories and acceptance criteria**

1. **Gamer sign-up** at `/join`.
   - Required: full name, email, mobile number (contact only), password (8+ characters), birth year, area, pincode, how they heard about us, and a ticked "I agree" box linked to `/privacy`.
   - Optional: gender, favourite games, marketing opt-in (unticked by default).
   - The mobile number is contact information only: it is never used to log in and no SMS is ever sent. It must be a valid Indian mobile (10 digits starting 6–9; `+91`/`0` prefixes and spaces are accepted and stored as `+91XXXXXXXXXX`). It does not have to be unique (siblings may share a number). Email is trimmed and lower-cased before it is stored or compared. Pincode must be 6 digits not starting with 0. Birth year must make the gamer at least 13; under-18s must also tick "a parent or guardian agrees" (DPDP needs verifiable parental consent for under-18s, recorded as a separate consent row).
   - A duplicate email shows "This email already has an account. Log in instead." and creates nothing.
   - On success: gamer is logged in, gets a unique member code (`SQ-` + 5 characters from an unambiguous alphabet, e.g. `SQ-7K2QM`), and lands on `/account`.
   - Consent rows are written in the same transaction as the account: `service` (always), `marketing` (if ticked), `guardian` (if under 18), each with the privacy notice version.
2. **Gamer login** at `/login`: email + password. Wrong details show one generic message. After 5 failed attempts for an email within 15 minutes, further attempts are refused for 15 minutes.
3. **Gamer account** at `/account`: shows name, member code, a QR code of the member code, and the profile. Gamer can edit everything, including email (must still be unique) and password (needs the current password). A gamer who forgets their password asks staff at the counter, who set a temporary one (no email sending in v1). Logout ends the session server-side.
4. **Privacy controls** at `/account/privacy`:
   - Toggle marketing consent (writes a new consent row; history is kept).
   - "Download my data" returns a JSON file with profile, consents and (once later modules exist) sessions, points and vouchers.
   - "Delete my account" asks for the password, then erases name, email, mobile number, password, birth year, gender and favourite games, keeps area and pincode with the anonymised play history for analytics, ends all their sessions, and logs them out. The email can be used to sign up again.
5. **Privacy notice** at `/privacy`: plain-language notice listing what is collected, why, how long it is kept, and how to withdraw consent or contact the business. Its version string (e.g. `2026-11-v1`) is a constant shared with the sign-up form.
6. **Staff and admin login** at `/staff/login`. Same lockout rule as gamers, keyed on username. Deactivated staff cannot log in and their existing sessions stop working.
7. **Gamer lookup** at `/staff/gamers`: staff search by member code, email or mobile number (exact match, not partial name search; a shared number can return more than one gamer) and see name, member code, mobile number, age band, area and join date. Staff can also set a temporary password for a gamer who forgot theirs. Every lookup and reset is written to the audit log.
8. **Staff management** at `/admin/staff` (admin only): list staff, create staff (username, display name, role, temporary password), deactivate/reactivate, reset password. Admins cannot deactivate themselves. All changes go to the audit log.
9. **First admin** is created from the command line: `npm run db:seed-admin` reads `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` and does nothing if that username exists.
10. **Access control**: `/account/**` needs a gamer session; `/staff/**` (except login) needs staff or admin; `/admin/**` needs admin. Anyone else is redirected to the right login page. Server actions and route handlers check the role themselves, not just the page.

## Tech Stack

- Next.js 15.5 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS v4 (already in the repo).
- **Supabase Postgres** (production and preview). Postgres 17 in Docker locally and for integration tests.
- **Drizzle ORM** + `drizzle-kit` for schema and SQL migrations, driver `postgres` (postgres.js). The Supabase connection uses the transaction pooler (port 6543) with `prepare: false`.
- **Why not Supabase Auth:** it would mean every query going through row-level-security policies tied to Supabase's own user table, and its email sign-up flow sends confirmation emails we don't need in v1. Instead the app owns auth: passwords hashed with Node's built-in `crypto.scrypt` (no native module), sessions as a random 32-byte token in an `httpOnly`, `secure`, `sameSite=lax` cookie, stored in the database as a SHA-256 hash, 30-day expiry for gamers and 12 hours for staff.
- **Locking Supabase down:** the app never uses the Supabase anon key or Data API. Every table has row-level security enabled with no policies, so the public API returns nothing even if the key leaks. `DATABASE_URL` is server-only.
- `zod` for input validation (shared by forms and server actions), `qrcode` for the member QR (rendered server-side as SVG), `server-only` to keep database code out of client bundles.
- Tests: Vitest, Playwright.

**New dependencies:** `drizzle-orm`, `postgres`, `zod`, `qrcode`, `server-only`; dev: `drizzle-kit`, `vitest`, `@playwright/test`, `@types/qrcode`, `tsx`, `dotenv`.

## Data model

```
gamers           id uuid pk, member_code text unique, email text unique null, password_hash text null,
                 full_name text null, phone text null,   -- contact only, not unique, indexed
                 birth_year int null, gender enum(male,female,other,prefer_not) null,
                 area text, pincode char(6), referral_source enum(instagram,google,friend,walk_in,whatsapp,other),
                 favourite_games text[], marketing_opt_in bool, created_at, updated_at, deleted_at null
staff            id uuid pk, username text unique, display_name text, password_hash text,
                 role enum(staff,admin), active bool, created_at, updated_at
consents         id uuid pk, gamer_id fk, purpose enum(service,marketing,guardian), granted bool,
                 notice_version text, created_at            -- append-only
auth_sessions    id uuid pk, token_hash text unique, gamer_id fk null, staff_id fk null, expires_at, created_at
                 -- exactly one of gamer_id / staff_id is set (check constraint)
login_attempts   id bigserial pk, kind enum(gamer,staff), identifier text, succeeded bool, created_at
audit_log        id bigserial pk, actor_staff_id fk null, actor_gamer_id fk null, action text,
                 target_type text, target_id text, details jsonb, created_at
```

Timestamps are `timestamptz` stored in UTC and shown in `Asia/Kolkata`.

## Commands

```
Start local DB:     docker compose up -d db
Generate migration: npm run db:generate
Apply migrations:   npm run db:migrate
Create first admin: npm run db:seed-admin
Dev server:         npm run dev
Lint:               npm run lint
Type check:         npm run typecheck
Unit + integration: npm test
E2E:                npm run test:e2e
Production build:   npm run build
```

Environment (`.env.local`, never committed; `.env.example` is committed):

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/square_lounge
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/square_lounge_test
SEED_ADMIN_USERNAME=owner
SEED_ADMIN_PASSWORD=change-me-now
```

## Project Structure

```
docker-compose.yml          local Postgres 17
drizzle.config.ts
drizzle/                    generated SQL migrations (committed), incl. RLS-enable migration
scripts/seed-admin.ts
src/
  db/
    index.ts                server-only Drizzle client
    schema/identity.ts      tables above
  server/identity/          domain logic, no React
    email.ts  phone.ts  password.ts  session.ts  gamers.ts  staff.ts  consent.ts  audit.ts  guards.ts
  lib/validation/identity.ts  zod schemas shared by forms and actions
  app/
    (public)/privacy/page.tsx
    (gamer)/join, login, account, account/privacy
    staff/login, staff/gamers
    admin/staff
  components/account/       forms and cards for these pages, reusing components/ui
tests/
  unit/identity/            email and mobile normalisation, password, member code, validation
  integration/identity/     sign-up, login lockout, delete, guards (real Postgres)
e2e/identity.spec.ts
```

## Code Style

Match the existing repo: named exports, small typed functions, a short `/** */` comment where intent is not obvious, `@/` imports, Tailwind classes via `cn()`. Domain functions return results instead of throwing for expected failures:

```ts
import "server-only";
import { normaliseEmail } from "@/server/identity/email";

export type LoginResult = { ok: true; gamerId: string } | { ok: false; reason: "invalid" | "locked" };

/** Checks a gamer's email and password, applying the 5-in-15-minutes lockout. */
export async function verifyGamerLogin(rawEmail: string, password: string): Promise<LoginResult> {
  const email = normaliseEmail(rawEmail);
  if (!email) return { ok: false, reason: "invalid" };
  if (await isLockedOut("gamer", email)) return { ok: false, reason: "locked" };
  // ...
}
```

- Files: `camelCase.ts` for modules, `PascalCase.tsx` for components. Database columns `snake_case`, TypeScript fields `camelCase`.
- Server actions live next to the page in `actions.ts`, validate with the shared zod schema, then call `src/server/**`. No database calls from components.

## Testing Strategy

- **Unit (Vitest):** email and mobile normalisation, member-code generation, password hash/verify, zod schemas (age and guardian rule, pincode).
- **Integration (Vitest + real Postgres via `TEST_DATABASE_URL`, migrated and truncated per test file):** sign-up writes gamer + consents atomically, duplicate email (case-insensitive), lockout timing, deleted account is scrubbed and can't log in, deactivated staff sessions are rejected, role guards.
- **E2E (Playwright against `npm run dev`):** sign up → see member code → log out → log in → delete account; admin creates staff → staff logs in → looks up the gamer.
- Every acceptance criterion above maps to at least one test. `npm test`, `npm run lint`, `npm run typecheck` and `npm run build` must pass before each commit.

## Boundaries

- **Always:** validate every input on the server with zod; check the role inside every server action; hash passwords with scrypt; keep secrets in env vars; write audit rows for staff actions; keep consent rows append-only; write migrations with drizzle-kit and commit them.
- **Ask first:** dependencies beyond the list above; changing the data model after this spec is approved; anything that changes the marketing pages beyond adding nav links to Join/Login; pushing to GitHub or connecting the real Supabase project.
- **Never:** commit `.env*` files or real credentials; use the Supabase anon/service key in the browser; log passwords, tokens, full email addresses or full mobile numbers; hard-delete play history; disable RLS on any table.

## Success Criteria

- All 10 acceptance criteria pass their tests; `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck`, `npm run build` all succeed.
- `select * from gamers` through the Supabase Data API with the anon key returns no rows (RLS check, done once against the real project).
- A gamer can sign up on a phone screen (375px wide) in under a minute with no horizontal scrolling.
- The marketing site's existing pages still build and render unchanged apart from the new nav links.

## Open Questions

- Business name and contact email for the privacy notice's "contact us" line (placeholders from `src/config/site.ts` are used until filled in).
- How long to keep data of gamers who stop visiting? Proposed: anonymise accounts with no visit for 3 years.
