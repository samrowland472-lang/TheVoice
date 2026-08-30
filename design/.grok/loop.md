# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`.
If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`types.ts` / `store.ts` / `render.ts` / `canvas-stage.tsx` / `export.ts` must be KB, not 11 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Backlog (priority order)

1. Pen tangent overlay polish on subtract results.
2. Selection PNG crop that includes rotated path bounds.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Boolean helpers in boolean-ops.ts; live inspector hover ghost.
- Rotation-aware contours: cubic handles flattened, then rotated, before punch.
- Overlapping subtract holes merge so even-odd does not refill.
- Paths render holes and cubics with evenodd / nonzero.
- Selection SVG export uses cubic `pathD`, holes, and even-odd / clip-rule.

## Iterations

### 2026-08-30T03:15Z — loop 72

**Selection SVG with holes and cubics.** Export → Selection SVG (or command palette) writes only the chosen layers, cropped to their box. Path `d` keeps cubic handles; holes are extra closed subpaths with `fill-rule` and `clip-rule` evenodd. Canvas paths now stroke the same cubics via `tracePath`, so print PNG matches the vector. Rasterize applies bleed/paper offset through `drawDocument` ox/oy.

### 2026-08-30T02:25Z — loop 71

**Boolean ghost + rotation-aware holes.** Shift-select two or more shapes. Inspector Boolean: hover Union / Subtract / Intersect / Exclude to ghost the path on the board; click commits. First selected layer keeps ink. Pen curves are sampled before subtract so a rotated path punches the stroke, not the anchors. Typecheck + build + smoke clean.

### 2026-08-30T00:08Z — loop 69

**MixedInk wired.**

## Next recommended

Pen tangent overlay polish on subtract results.
