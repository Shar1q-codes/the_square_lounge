# The Square Lounge

Marketing site for The Square Lounge, a premium PlayStation lounge in Malakpet, Hyderabad.
Built with Next.js 15 (App Router), React Three Fiber, GSAP + ScrollTrigger, Lenis and Tailwind CSS v4.
Bookings open a pre-filled WhatsApp message. Member accounts (sign-up, login, profile, privacy controls)
and the staff/admin counter pages run on Supabase Postgres through Drizzle; see "Member accounts" below.

## Run it (PowerShell)

```powershell
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

## Edit business details

Everything (address, phone, WhatsApp, Instagram, hours, stations, pricing, games, gallery, feature copy)
lives in **`src/config/site.ts`**. Components only read from there.

- Values starting with `TODO:` are placeholders. On the page the `TODO:` prefix is hidden so the design
  reads naturally. In `npm run dev`, a badge in the bottom-left corner lists every placeholder still left.
- Placeholders are never published in the SEO structured data, and WhatsApp/phone buttons stay disabled
  until real numbers are filled in.
- `contact.whatsapp` must be digits only, with the country code (for example `919876543210`).
- `site.url` must be the real domain before launch; it feeds canonical links, the sitemap and share images.

## Gallery photos

Put photos in `public/images/gallery/` and list them in `site.gallery` with their real pixel `width` and
`height` (any aspect ratio works). JPG, PNG and WebP are optimised automatically by `next/image`.
Then delete the `placeholder-0*.svg` files.

## Project layout

```
src/
  app/          layout (metadata), page, icon.svg, apple-icon, opengraph/twitter images, robots, sitemap, manifest
  config/       site.ts (all business data)
  components/
    layout/     Navbar, Footer, SmoothScroll (Lenis), PlaceholderNotice (dev only)
    sections/   Hero, Stations, Experience, Games, Pricing, Gallery, Location, Booking
    three/      the 3D hero: HeroCanvas, Scene, ObsidianCube, SquareFrame, ScreenOrbit, StationScreen,
                Dust, Lighting, Effects, CameraRig, SquareLoader
    ui/         Button, Card, Badge, SectionHeading, Reveal, SquareMark, SquareDivider, icons
  hooks/        useReducedMotion, useIsMobile, useMediaQuery
  lib/          booking (validation + WhatsApp message), contact links, jsonld, gsap, forms, validation/
  db/           Drizzle schema and server-only client
  server/       domain logic for member accounts (identity)
```

## 3D hero notes

- Loaded client-side only (`next/dynamic`, `ssr: false`) behind a self-drawing square loader.
- Rendering pauses when the hero is off-screen; DPR is capped at 1.75 and drops (then effects switch off)
  if the frame rate stays low. Phones get fewer particles and lighter effects.
- Visitors with "reduce motion" turned on, or without WebGL, get a static CSS version instead.
- The dust is a custom shader on purpose: drei's `<Sparkles>` writes negative alpha, which shows up as dark
  squares inside the post-processing buffers.

## Member accounts (backend)

Specs: `CAPABILITY-MAP.md`, `SPEC-identity.md`, `SPEC-play-sessions.md`, `SPEC-loyalty.md`, `SPEC-analytics.md`;
plans in `tasks/`.

- Gamers: `/join`, `/login`, `/account` (member QR, points, now playing, recent visits), `/account/points`,
  `/account/vouchers`, `/account/privacy`, `/shop` (public points shop), `/privacy`
- Counter: `/staff/login`, `/staff` (station board: check in/out, payments, cancel within 15 min),
  `/staff/gamers` (lookup, points balance), `/staff/vouchers` (redeem)
- Admin: `/admin/analytics` (dashboard + CSV downloads), `/admin/sessions` (fix forgotten check-outs, audited),
  `/admin/offers`, `/admin/staff`; admins can also adjust a member's points from `/staff/gamers`

Analytics count a "day" from 4 am to 4 am IST (the lounge is open 11 am–4 am), so late-night play belongs to the
evening it started. The win-back list is members with 2+ visits and none in 15 days; its CSV only includes members
who opted in to offers.

Points rules (rate per console, 12-hour cap, voucher expiry) live in `src/config/loyalty.ts`. Points are added at
check-out and recalculated when an admin corrects a session; every change is a row in `points_ledger`.

Stations come from `site.stations` in `src/config/site.ts`. `maxCheckIns` is how many members staff can check
in at once (default 8, for 6–8 player games); `maxPlayers` is only the number shown on the website.
Re-run `npm run db:seed` after changing stations.

First-time setup (needs Docker Desktop running):

```powershell
copy .env.example .env.local   # then edit SEED_ADMIN_PASSWORD
docker compose up -d db        # local Postgres 17 (+ a separate test database)
npm run db:migrate
npm run db:seed                # stations from site.ts + first admin from .env.local
npm run db:seed-demo           # optional: 40 demo members, 2 months of visits, offers (DEMO_PASSWORD)
```

### Demo data

`npm run db:seed-demo` fills a database with believable data so every page has something to show: ~40 members
around Malakpet, two months of visits (busier evenings and weekends, groups, a few check-outs without an amount),
points, 4 offers, vouchers, a few lapsed regulars for the win-back list, and members playing right now if the lounge
is open. Log in as any member with an email ending `@demo.squarelounge.test` (e.g. `arjun.1@demo.squarelounge.test`)
or as counter staff `demo.counter`, all with `DEMO_PASSWORD`. Re-running replaces it; `npm run db:clear-demo`
removes it and never touches real members. **Clear it before launch** so it doesn't mix into real analytics.

### Working with Supabase from this PC

Add `SUPABASE_DB_URL` to `.env.local` (Supabase → **Connect** → **Session pooler**, port 5432, with the database
password filled in; reset the password under **Project Settings → Database** if you don't have it). Then:

```powershell
npm run supabase:migrate       # apply new migrations to the live database (run after every schema change)
npm run supabase:seed          # stations + first admin (refuses the example password)
npm run supabase:seed-demo     # optional demo data on the live database
npm run supabase:clear-demo    # remove demo data before launch
```

Each command prints which database it is about to change. Without `supabase:` they only touch your local database.

Tests:

```powershell
npm test           # unit + integration (uses TEST_DATABASE_URL; wipes it)
npm run test:e2e   # Playwright (builds into .next-e2e, so it can run next to `npm run dev`)
npm run typecheck
```

Schema changes: edit `src/db/schema/*`, then `npm run db:generate` and commit the new file in `drizzle/`.
Every new table needs `ENABLE ROW LEVEL SECURITY` (a test fails otherwise) so Supabase's public API can't read it.

Code layout: `src/db` (schema, client), `src/server/identity` (accounts, logins, lockout, consent, audit), `src/server/sessions` (stations, check-in/out, corrections, history), `src/server/loyalty` (ledger, awards, offers, vouchers), `src/server/analytics` (dashboard queries, CSV),
`src/lib/validation` (form rules), `src/app/(gamer)`, `src/app/staff`, `src/app/admin`, `tests/`, `e2e/`.

## Deploy (Netlify + Supabase)

1. Create a Supabase project (region: South Asia (Mumbai), close to your members and fastest).
2. From your PC, with `SUPABASE_DB_URL` in `.env.local` (see "Working with Supabase from this PC"):
   `npm run supabase:migrate`, then `npm run supabase:seed`.
3. On Netlify (the site is already linked to this GitHub repo): **Site configuration → Environment variables**, add
   - `DATABASE_URL` = the same pooler URI
   - `CRON_SECRET` = a long random string (e.g. from a password manager)

   then **Deploys → Trigger deploy**. Netlify picks up Next.js automatically; `netlify.toml` pins the build command
   and Node 22.
4. Set `site.url` in `src/config/site.ts` to the real address (your Netlify domain or custom domain). It feeds
   canonical links, the sitemap and share images.

Daily voucher expiry: `netlify/functions/expire-vouchers.ts` is a Netlify Scheduled Function that calls
`/api/cron/expire-vouchers` at 2:00 am IST with `CRON_SECRET`. It shows under **Logs → Functions** in Netlify.
Vouchers also expire whenever someone views or redeems them, so this is a safety net.

The app never uses Supabase's anon or service keys; all tables have row-level security on with no policies.
