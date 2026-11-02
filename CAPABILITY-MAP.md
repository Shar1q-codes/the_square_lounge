# Capability Map: The Square Lounge Loyalty + Analytics

Adds a backend to the existing static marketing site (Next.js 15, App Router). The marketing pages stay as they are.

| Module id | Responsibility | Depends on |
|---|---|---|
| `identity` | Gamer accounts (sign-up, login, profile, area/pincode), staff and admin accounts with roles, consent records (DPDP Act 2023), account export and deletion | — |
| `play-sessions` | Staff check a gamer in to a station and out again; one open session per gamer and per station; flags sessions left open too long | `identity` |
| `loyalty` | Append-only points ledger (credits from finished sessions, debits from redemptions, admin adjustments) and the points shop (offers, claims, voucher codes that staff fulfil at the counter) | `identity`, `play-sessions` |
| `analytics` | Admin dashboard: footfall and hours by day and hour, station use, top and lapsed gamers, area/pincode breakdown, sign-up source, redemption rates, CSV export | `identity`, `play-sessions`, `loyalty` |

Build order: `identity` → `play-sessions` → `loyalty` → `analytics`

Each module gets its own spec (`SPEC-identity.md`, `SPEC-play-sessions.md`, and so on) once this map is approved.

## Assumptions (correct any of these before module specs are written)

1. **Same repo, same app.** The backend lives in this Next.js project (route handlers and server actions). No separate API server.
2. **Database:** Supabase (Postgres) with Drizzle ORM, accessed only from the server. Plain Docker Postgres (same major version) locally and in tests. Hosting is on Netlify. *(Approved 2026-11-03: Supabase chosen; owner confirmed Netlify, not Vercel.)*
3. **Gamer login:** gamers create accounts and log in on the website with email + password. A mobile number is collected at sign-up as contact info only (never used to log in, no SMS). Points balance, history and shop redemptions are all on the website. *(Changed 2026-11-03 at the owner's request.)*
4. **Staff and admin login:** username + password, two roles: `staff` (check-in/out, fulfil vouchers) and `admin` (everything, including the dashboard, offers and points adjustments).
5. **Check-in is done by staff at the counter**, by searching the gamer's member code, email or mobile number, or scanning a QR code on the gamer's profile. Gamers cannot start or end their own sessions, which prevents points farming.
6. **Points rule:** 10 points per hour, earned per full minute (1 point per 6 minutes), rounded down. Rate is configurable per console type (PS5/PS4). A session is capped at 12 hours for points; anything longer is flagged for an admin to review.
7. **Amount paid is recorded at check-out** (optional field for staff). This is what makes revenue analytics possible. Café orders are out of scope for v1.
8. **Points shop flow:** admin creates offers (points cost, optional stock and dates). A gamer claims an offer, points are deducted at once, and they get a voucher code. Staff mark the code as used at the counter. Unused vouchers expire after 30 days and the points are refunded.
9. **Profile data collected:** name, email, mobile number (contact only), birth year, optional gender, area + pincode (no GPS), how they heard about the lounge, favourite games. Separate opt-in for marketing messages.
10. **DPDP compliance:** consent captured at sign-up with timestamp and privacy-notice version; gamers can download their data and delete their account; analytics use aggregates; a privacy notice page is added.
11. **Testing:** Vitest for domain logic (points maths, ledger, voucher rules) and Playwright for the main flows (sign up → check in → check out → points → redeem).

## Open questions

- Is 10 points per hour, and the 12-hour cap, the right starting rule?
- What offers do you want in the shop at launch (for example a free hour, a café item, a discount)?
- Should café spending earn points in a later version?
