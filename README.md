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

Specs: `CAPABILITY-MAP.md`, `SPEC-identity.md`, `SPEC-play-sessions.md`; plans in `tasks/`.

- Gamers: `/join`, `/login`, `/account` (member QR, now playing, recent visits), `/account/privacy`, `/privacy`
- Counter: `/staff/login`, `/staff` (station board: check in/out, payments, cancel within 15 min), `/staff/gamers`
- Admin: `/admin/sessions` (fix forgotten check-outs, audited), `/admin/staff`

Stations come from `site.stations` in `src/config/site.ts`. `maxCheckIns` is how many members staff can check
in at once (default 8, for 6–8 player games); `maxPlayers` is only the number shown on the website.
Re-run `npm run db:seed` after changing stations.

First-time setup (needs Docker Desktop running):

```powershell
copy .env.example .env.local   # then edit SEED_ADMIN_PASSWORD
docker compose up -d db        # local Postgres 17 (+ a separate test database)
npm run db:migrate
npm run db:seed                # stations from site.ts + first admin from .env.local
```

Tests:

```powershell
npm test           # unit + integration (uses TEST_DATABASE_URL; wipes it)
npm run test:e2e   # Playwright (builds into .next-e2e, so it can run next to `npm run dev`)
npm run typecheck
```

Schema changes: edit `src/db/schema/*`, then `npm run db:generate` and commit the new file in `drizzle/`.
Every new table needs `ENABLE ROW LEVEL SECURITY` (a test fails otherwise) so Supabase's public API can't read it.

Code layout: `src/db` (schema, client), `src/server/identity` (accounts, logins, lockout, consent, audit), `src/server/sessions` (stations, check-in/out, corrections, history),
`src/lib/validation` (form rules), `src/app/(gamer)`, `src/app/staff`, `src/app/admin`, `tests/`, `e2e/`.

## Deploy

1. Create a Supabase project (region: Mumbai). In **Connect**, copy the **Transaction pooler** URI (port 6543).
2. Apply migrations once from your PC: `$env:DATABASE_URL="<that URI>"; npx drizzle-kit migrate`, then
   `npm run db:seed` the same way.
3. In Vercel, set `DATABASE_URL` to the same URI (Production and Preview), then deploy.

The app never uses Supabase's anon or service keys; all tables have row-level security on with no policies.
