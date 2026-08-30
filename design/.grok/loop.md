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

1. Inspector Boolean hover + commit buttons (wired to store preview).
2. Marquee / move / create tools restored on the canvas overlay.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Boolean helpers in boolean-ops.ts; live inspector hover ghost.
- Rotation-aware contours: cubic handles flattened, then rotated, before punch.
- Overlapping subtract holes merge so even-odd does not refill.
- Paths render holes and cubics with evenodd / nonzero.
- Selection SVG export uses cubic `pathD`, holes, and even-odd / clip-rule.
- Subtract results simplify, restore mirrored cubics, and show hole tangents.
- Selection PNG crop uses rotated path/hole cubic hull + stroke pad.
- Pen overlay hits and drags cubic handles on outer contours **and subtract holes**.

## Iterations

### 2026-08-30T06:20Z — loop 75

**Hole-handle drag.** Select or Pen on a path with holes: cooler diamonds on inner contours are live. Drag an in/out arm to reshape the hole; Alt breaks smooth mirroring. Paths stroke through `tracePath`. Store gained `editPathHit`, `applyBoolean`, and fit-selection.

### 2026-08-30T05:16Z — loop 74

**Rotated selection PNG.** `aabb` now samples path anchors, cubic handles, and holes in world space after rotation, then pads by half stroke.

### 2026-08-30T04:12Z — loop 73

**Pen tangents on subtract.** Boolean results drop collinear samples and get mirrored cubic handles.

### 2026-08-30T03:15Z — loop 72

**Selection SVG with holes and cubics.**

### 2026-08-30T02:25Z — loop 71

**Boolean ghost + rotation-aware holes.**

## Next recommended

Inspector Boolean hover + commit buttons (wired to store preview).
