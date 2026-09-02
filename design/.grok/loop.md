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

1. Align / distribute across islands that still live on one compound path.
2. Knife cuts on self-overlapping traces after the winding split.

## Done

- Figure-eight / bowtie traces run a winding pass before boolean clip: returning to a vertex closes a simple lobe, crossings are inserted first, and nested twists recurse so clip sees simple rings.
- Align and distribute use each layer's geometry box, so converted type islands (tightened onto their own contours) line up and space by ink, not by the original text frame.
- Distribute actually runs: three-plus selected layers even out horizontal or vertical gaps; first and last stay put.
- Boolean apply keeps hole ownership on 3+ mixed compounds.
- Hover boolean ghosts draw every resulting compound, including nested islands.
- Knife live preview on the artboard (K).

## Iterations

### 2026-09-02T08:28Z — loop 125

**Winding pass on self-overlapping traces.** Figure-eight and bowtie contours are split into simple lobes before union/subtract/intersect/exclude. Each return to a vertex closes a lobe; remaining twists recurse with a depth cap.

### 2026-09-02T08:20Z — loop 124

**Align / distribute on converted path islands.** Type converted to paths now tightens each glyph onto its contour. Align left/center/right/top/middle/bottom and distribute H/V use those geometry boxes.

### 2026-09-02T07:30Z — loop 123

**Boolean apply keeps islands inside punched holes.**

## Next recommended

Align / distribute across islands that still live on one compound path.
