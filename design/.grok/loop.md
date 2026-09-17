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

1. Present-mode safe-area overlay contrast on dark grounds.
2. Mixed shadow chip hover ghosts.

## Done

- Mixed width / dash / offset slider and chip hover ghosts: Stroke inspector sliders (width, dash, offset, miter, sides, head) paint a phosphor overlay while dragging. Mixed chips for width, dash, offset, cap, join, miter, sides, and head hover or focus the same overlay with only that field. `strokeGhost` is ephemeral (cleared on select change, pointer leave, blur) and not written to localStorage. Canvas `drawStrokeGhosts` now runs on the live selection after `drawDocument`.

- Mixed fill-rule chip hover ghost on paths with holes.

- Corner-radius hover ghost on mixed rectangles.

- Sides hover ghost on mixed polygons / stars.

- Mixed cap / join chip hover ghost.

- Arrow head-scale hover ghost.

- Slider drag ghosts (partial; now wired on canvas).

- Arrow heads as true paths on canvas.

## Iteration

2026-09-17 04:14 BST — Mixed width / dash / offset / cap / join slider and chip hover ghosts wired to canvas.

## Next recommended

Present-mode safe-area overlay contrast on dark grounds.
