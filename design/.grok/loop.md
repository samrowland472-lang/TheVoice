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

1. Export selection as SVG with holes and even-odd fill rule.
2. Pen tangent overlay polish on subtract results.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Boolean helpers in boolean-ops.ts; live inspector hover ghost.
- Rotation-aware contours: cubic handles flattened, then rotated, before punch.
- Overlapping subtract holes merge so even-odd does not refill.
- Paths render holes and cubics with evenodd / nonzero.

## Iterations

### 2026-08-30T02:25Z — loop 71

**Boolean ghost + rotation-aware holes.** Shift-select two or more shapes. Inspector Boolean: hover Union / Subtract / Intersect / Exclude to ghost the path on the board; click commits. First selected layer keeps ink. Pen curves are sampled before subtract so a rotated path punches the stroke, not the anchors. Typecheck + build + smoke clean.

### 2026-08-30T00:08Z — loop 69

**MixedInk wired.**

## Next recommended

Export selection as SVG with holes and even-odd fill rule.
