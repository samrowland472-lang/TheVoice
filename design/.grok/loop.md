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

1. Mixed cap / join chip hover ghost (cap and join only, without dash).
2. Sides hover ghost on mixed polygons / stars.

## Done

- Arrow head-scale hover ghost: mixed head chips hover or focus a phosphor overlay on selected arrows using that chip’s `headScale`. Dragging the Head slider paints the same overlay. `strokeGhost.headScale` is ephemeral (cleared on select change, pointer leave, blur) and not written to localStorage. Non-arrow outlines are skipped so only chevrons reshape.

- Slider drag ghosts: width, dash, offset, and miter range sliders paint a phosphor overlay on selected outlines while dragging. Mixed width / offset / miter / dash chips hover the same overlay. `strokeGhost` is ephemeral (cleared on select change) and not written to localStorage.

- Arrow heads as true paths on canvas: drawNode and fill silhouettes use `arrowPath` built from `arrowPoints(w, h, headScale)`. Export, boolean ops, and stroke ghosts share the same contour, so head scale changes the chevron instead of painting a rectangle.

## Iteration

2026-09-16 16:25 BST — Arrow head-scale hover ghost on the canvas.

## Next recommended

Mixed cap / join chip hover ghost (cap and join only, without dash).
