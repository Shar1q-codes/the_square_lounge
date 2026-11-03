# Implementation Plan: The Lounge in 3D + brand logos

Spec: [SPEC-lounge-3d.md](../SPEC-lounge-3d.md). Approved 2026-11-04 with default answers: estimated room size,
model what the photos show (~8 screens), stylised poster art, and the 4 room photos go into the gallery.
Branch `feat/lounge-3d` from `main`.

## Architecture Decisions

- **Logos traced once to SVG** (potrace, outside the repo) and committed as React components + `public/brand/*.svg`.
  One vertical gold gradient per logo reproduces the originals.
- **Hero logo** = the traced controller/burger path → `SVGLoader` shapes → `ExtrudeGeometry` with bevel, gold
  `MeshPhysicalMaterial`; replaces `ObsidianCube` only, so the hero's pause/quality logic is untouched.
- **Lounge model is data + code:** `src/config/lounge.ts` holds dimensions and every item's position; components in
  `src/components/lounge/` build geometry procedurally (rounded boxes, instancing, canvas-drawn textures). No model files.
- **Phone landscape:** a shell that, in portrait, renders the canvas container rotated 90° at viewport size swapped,
  and maps pointer input through the same rotation; Android fullscreen + `screen.orientation.lock("landscape")` when allowed.
- **Lazy:** `/lounge` loads the canvas with `next/dynamic` (`ssr: false`); nothing 3D is added to other pages.

## Phases (check-in screenshots after 2, 3 and 4)

- [ ] 1. Logos traced; `TslMonogram` replaces `SquareMark` (navbar, footer, shells, loader); icon.svg, apple-icon,
      OG/Twitter images, manifest
- [ ] 2. Hero: extruded gold controller/burger logo instead of the cube
- [ ] 3. Room shell, floor, pillars, ceiling tray, LED strips, cove colour cycle, downlights, fans
- [ ] 4. TVs + consoles + marble stands, sofas + cushions, bean bags, café tables + chairs, curtains, door, posters,
      banner, AC, CCTV, switchboards, bin, entrance glass
- [ ] 5. `/lounge` page, nav/footer link, guided tour + 5 viewpoints, tap-a-TV card, phone landscape shell,
      reduced-motion + no-WebGL fallbacks, adaptive quality; gallery photos
- [ ] 6. Tests (unit for layout/orientation maths, e2e for nav, page, viewpoints, phone view), full gate, push
