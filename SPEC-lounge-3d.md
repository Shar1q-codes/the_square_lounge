# Spec: The Lounge in 3D + brand logos

A marketing-site feature (not one of the four backend modules). Branch `feat/lounge-3d`, from `main`.

## Objective

Let visitors walk around a 3D model of the real Square Lounge before they visit, and put the real brand marks everywhere the site currently uses the placeholder square mark.

1. **"The Lounge" page** at `/lounge`, linked as **"The Lounge"** in the navbar (desktop and phone menu) and the footer. It holds an interactive three.js model of the hall, built to match the owner's 4 photos.
2. **On phones the 3D view is shown in landscape**, so the long room fits the screen.
3. **The TSL monogram** replaces the placeholder mark across the site, and the **controller-and-burger logo**, extruded in gold metal, replaces the obsidian cube at the centre of the hero.

## What the photos show (the model's checklist)

From the 4 room photos (2000×1500 each):

| Element | Details to match |
|---|---|
| Room | One long open hall with light aqua walls, a white ceiling and glossy white floor tiles that reflect the lights |
| Ceiling | Stepped false ceiling: a large tray with a smaller raised centre panel with a grid pattern. **Cyan LED line strips** in sets of three forming a chevron/fan on each side. A **colour-changing cove light** around the centre panel (the photos show blue, purple, teal and magenta), plus a warm or green perimeter cove. Round recessed downlights all over. |
| Ceiling fans | About 6 black 3-blade fans with a gold ring |
| Pillars | 3 square aqua columns (one near the entrance, two in the middle) |
| TV stations | About 8 wall-mounted black TVs (50–65"), most over a **white marble-look console table** with a white PS5 or a black PS4. A few big screens stand on the left wall at the entrance. |
| Seating | **Grey sofas with a diamond-quilted back** and square cushions, set back to back in the middle; **bean bags** in maroon, red, plum and blue |
| Café corner | Dark wood tables with folding black legs, black slatted chairs, a laptop |
| Back wall | **Maroon curtains** over the windows, a wooden door |
| Walls | Framed posters (game and football art), the standing banner ("EAT. PLAY. DOMINATE.", TSL logo, burger/pizza art), AC units, dome CCTV cameras, switchboards, a teal dustbin |
| Entrance | Glass door to the stairs at the front left |

## Assumptions (confirm or correct)

1. **Hand-built, not a scan.** Four photos aren't enough for photogrammetry, so I'll model the room piece by piece in three.js, sized from the photos: about **15 m × 9 m × 3.2 m**, with real-world sizes for sofas, TVs, bean bags and so on. It will look like the photos (layout, colours, lights, furniture), not be a photo-real copy. If you can measure the room (length, width, ceiling height), I'll use your numbers.
2. **Station layout:** I count about 8 screens in the photos, but the website lists 5 stations. I'll model what the photos show. **Please send a quick sketch or list of which TV is where**, if you want it exact.
3. **Posters:** the GTA, Need for Speed, God of War and Messi/Neymar/Mbappé posters belong to their publishers and players, so copying them onto your website could be a copyright problem. I'll hang **matching frames with stylised neon artwork in the same colours** instead. The banner gets your own **TSL / "EAT. PLAY. DOMINATE."** branding, which is yours to use. You can send poster art you have the rights to, and I'll swap it in.
4. **Moving around:** the page opens with a slow guided camera tour. Drag (or swipe) to look around, scroll or pinch to zoom, and use buttons to jump to **Entrance · PS5 wall · Sofas · Café corner · Overview**. Tapping a TV shows that station's name, console and "Book this station".
5. **Lights:** the LED strips glow, the centre cove slowly cycles blue → purple → teal → magenta as in the photos, and fans turn. The floor shows light reflections on computers; phones get a lighter version of the floor so the page stays smooth.
6. **Phones:** when held upright, the 3D view opens **full-screen, rotated sideways**, with touch controls that follow the rotation, and a "rotate your phone" hint. On Android Chrome it also asks the phone to lock to landscape. iPhones don't allow that, so the sideways view covers them. Turning the phone sideways for real just works.
7. **Fallbacks:** with reduced motion turned on there's no auto tour and the fans stay still. Without WebGL, the page shows your 4 photos instead of the model.
8. **Logos:** I'll trace your 3 logo files into clean vector shapes, so they stay sharp at any size, keeping the gold gradient.
   - **TSL monogram:** in the navbar, footer, account and staff pages, the browser tab icon, the phone home-screen icon, the share-link images and the loading animation.
   - **Controller-and-burger logo:** the hero centrepiece, extruded in polished gold with a bevel and a slow float that reacts to the mouse. The orbiting screens and dust stay around it. It also appears on the Lounge page loader.
   - **Cream version:** kept for light backgrounds (e.g. printouts); the site itself is dark, so gold is the default.
9. **Gallery (bonus, optional):** your 4 room photos replace the placeholder images in the homepage gallery. Say no if you'd rather not.

## Acceptance criteria

1. "The Lounge" is in the navbar (desktop and phone) and the footer, and opens `/lounge`. From `/lounge`, the other navbar links go back to the homepage sections (e.g. `/#pricing`).
2. `/lounge` shows the 3D hall with every element in the checklist above, within the limits of assumptions 2 and 3.
3. The guided tour, drag/pinch/zoom, the 5 viewpoint buttons and tapping a TV all work with mouse and touch.
4. On a phone held upright (375×812), the 3D view fills the screen sideways, drag directions match what you see, and there's no sideways page scrolling.
5. The page stays smooth: at least 45 fps on a mid-range Android phone, at least 55 fps on a laptop. The model itself adds under 300 kB of JavaScript (three.js is already on the site), and it loads only on `/lounge`.
6. Reduced motion and no-WebGL fallbacks behave as in assumption 7.
7. The TSL monogram appears everywhere listed in assumption 8. The old placeholder square mark is gone.
8. The hero shows the 3D controller-and-burger logo instead of the cube; the hero's existing speed safeguards (pausing off-screen, lowering quality on slow devices) still work.
9. Lint, type checks, all tests and the build pass. New browser tests cover the nav link, the page loading, the viewpoint buttons and the phone view. I'll compare screenshots with your photos at each step.

## How it's built

- `src/components/lounge/`: `LoungeCanvas` (canvas, quality settings), `Room` (walls, floor, ceiling tray), `CeilingLights` (strips, cove colour cycle, downlights), `Fans`, `Stations` (TVs, consoles, tables), `Seating` (sofas, cushions, bean bags), `Cafe`, `Details` (curtains, posters, banner, AC, CCTV, switchboards, bin, door), `Tour` (camera path, viewpoints), `LandscapeShell` (the phone rotation).
- `src/config/lounge.ts`: room size and where each item sits, in one place, so layout fixes are edits to data rather than code.
- All geometry is built in code (boxes, rounded boxes, extrusions, instanced copies for repeats). No large model files to download; textures are drawn in code (marble, tiles, quilting, grid).
- Logos: the vector files go in `src/components/brand/` (as components) and `public/brand/`. The hero logo is the traced shape, extruded and bevelled.

## Boundaries

- **Always:** compare with your photos at each step; keep the page fast on phones; keep the hero's speed safeguards; credit nothing to third parties without rights.
- **Ask first:** using any copyrighted poster or game art; adding a downloaded 3D model library; changing the homepage beyond the logo, the nav link and (if you say yes) the gallery photos.
- **Never:** ship scanned or copied artwork we don't have rights to; load the 3D model on pages other than `/lounge`.

## Build order and check-ins

1. **Logos everywhere** (quick): trace, components, icons, share images.
2. **Hero 3D logo:** I show you a screenshot.
3. **Room shell, ceiling and lights:** screenshots next to your photos, **check-in with you** (the look is set here).
4. **Furniture, stations and details:** screenshots next to your photos.
5. **Page, nav, tour, phone landscape, fallbacks, speed:** browser tests and the final check.

## Open questions

- Room measurements, if you have them (assumption 1)?
- Which TV is which station (assumption 2)?
- OK to use stylised poster art (assumption 3)?
- Use your 4 photos in the homepage gallery (assumption 9)?
