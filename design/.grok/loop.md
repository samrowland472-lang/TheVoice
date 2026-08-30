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

1. Drag cubic handles on subtract holes from the pen overlay.
2. Inspector Boolean hover + commit buttons (wired to store preview).

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Boolean helpers in boolean-ops.ts; live inspector hover ghost.
- Rotation-aware contours: cubic handles flattened, then rotated, before punch.
- Overlapping subtract holes merge so even-odd does not refill.
- Paths render holes and cubics with evenodd / nonzero.
- Selection SVG export uses cubic `pathD`, holes, and even-odd / clip-rule.
- Subtract results simplify, restore mirrored cubics, and show hole tangents.
- Selection PNG crop uses rotated path/hole cubic hull + stroke pad.

## Iterations

### 2026-08-30T05:16Z — loop 74

**Rotated selection PNG.** `aabb` now samples path anchors, cubic handles, and holes in world space after rotation, then pads by half stroke. Export → Selection PNG / Selection SVG crop to that box. Canvas paths stroke the same cubics via `tracePath`; `drawDocument` honors viewport, paper ox/oy, boolean ghost, and pen tangents. Boolean shortcuts and Shift+0 fit-selection land in the store.

### 2026-08-30T04:12Z — loop 73

**Pen tangents on subtract.** Boolean results drop collinear samples and get mirrored cubic handles. Select or Pen on the result draws phosphor arms on the outer contour and cooler hole diamonds.

### 2026-08-30T03:15Z — loop 72

**Selection SVG with holes and cubics.** Export → Selection SVG (or command palette) writes only the chosen layers, cropped to their box.

### 2026-08-30T02:25Z — loop 71

**Boolean ghost + rotation-aware holes.** Shift-select two or more shapes. First selected layer keeps ink.

## Next recommended

Drag cubic handles on subtract holes from the pen overlay.
