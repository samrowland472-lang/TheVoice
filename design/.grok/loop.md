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

1. Self-overlapping figure-eight traces still need a winding pass before clip.
2. Align / distribute across islands that still live on one compound path.

## Done

- Align and distribute use each layer's geometry box, so converted type islands (tightened onto their own contours) line up and space by ink, not by the original text frame.
- Distribute actually runs: three-plus selected layers even out horizontal or vertical gaps; first and last stay put.
- Boolean apply keeps hole ownership on 3+ mixed compounds: an island that lives inside a punched hole stays on the same evenodd path instead of becoming a second filled node. `groupIslands` parents every ring to its smallest container and hangs the whole descendant tree off the root outer.
- Hover boolean ghosts draw every resulting compound, including nested islands.
- Design store is typed so the studio typechecks.
- Knife live preview on the artboard (K).

## Iterations

### 2026-09-02T08:20Z — loop 124

**Align / distribute on converted path islands.** Type converted to paths now tightens each glyph onto its contour. Align left/center/right/top/middle/bottom and distribute H/V use those geometry boxes, so letters and boolean islands move independently instead of sharing the old text frame.

### 2026-09-02T07:30Z — loop 123

**Boolean apply keeps islands inside punched holes.** Three-plus selections (donut + island-in-hole + another shape) now commit as one evenodd compound per top-level outer. Nested fill rings stay descendants of the hole that owns them. Preview traces every part.

### 2026-09-02T05:25Z — loop 122

**Boolean preview holes on mixed compounds.** Nested offset rings plus type-converted letters no longer fill their counters in the hover ghost.

### 2026-09-02T04:20Z — loop 121

**Knife live preview.** The knife tool is live on the artboard.

## Next recommended

Self-overlapping figure-eight traces still need a winding pass before clip.
