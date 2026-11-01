# The Square Lounge

Marketing site for The Square Lounge, a premium PlayStation lounge in Malakpet, Hyderabad.
Built with Next.js 15 (App Router), React Three Fiber, GSAP + ScrollTrigger, Lenis and Tailwind CSS v4.
It is a fully static site with no backend; bookings open a pre-filled WhatsApp message.

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
  lib/          booking (validation + WhatsApp message), contact links, jsonld, gsap
```

## 3D hero notes

- Loaded client-side only (`next/dynamic`, `ssr: false`) behind a self-drawing square loader.
- Rendering pauses when the hero is off-screen; DPR is capped at 1.75 and drops (then effects switch off)
  if the frame rate stays low. Phones get fewer particles and lighter effects.
- Visitors with "reduce motion" turned on, or without WebGL, get a static CSS version instead.
- The dust is a custom shader on purpose: drei's `<Sparkles>` writes negative alpha, which shows up as dark
  squares inside the post-processing buffers.

## Deploy

Push to GitHub and import the repo in Vercel; no environment variables are needed.
