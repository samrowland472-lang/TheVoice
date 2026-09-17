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

1. Mixed width / dash / offset slider ghosts still missing hover wiring on some chips — polish if needed.
2. Present-mode safe-area overlay contrast on dark grounds.

## Done

- Mixed fill-rule chip hover ghost on paths with holes: two or more holed paths show a Fill rule inspector. Mixed chips hover or focus a phosphor fill overlay that rebuilds each selected path with that chip’s `fillRule` (even-odd punches holes, nonzero keeps islands). Non-path outlines and paths without holes are skipped. `strokeGhost.fillRule` is ephemeral (cleared on select change, pointer leave, blur) and not written to localStorage. Canvas `drawStrokeGhosts` now paints the overlay for every ghost field.

- Corner-radius hover ghost on mixed rectangles: mixed radius chips hover or focus a phosphor overlay that rebuilds each selected rectangle with that chip’s `radius`. Dragging the Radius slider paints the same overlay. `strokeGhost.radius` is ephemeral (cleared on select change, pointer leave, blur) and not written to localStorage. Non-rect outlines are skipped so only those corners reshape.

- Sides hover ghost on mixed polygons / stars: mixed sides chips hover or focus a phosphor overlay that rebuilds each selected polygon or star with that chip’s `sides`. Dragging the Sides slider paints the same overlay. `strokeGhost.sides` is ephemeral (cleared on select change, pointer leave, blur) and not written to localStorage. Non-polygon/star outlines are skipped so only those contours reshape.

- Mixed cap / join chip hover ghost: cap chips set `strokeGhost` to `{ lineCap }` only and join chips set `{ lineJoin }` only — no dash piggyback. Hover, focus, and leave/blur clear the ephemeral overlay. Canvas draws `drawStrokeGhosts` for the current selection. Width / dash / offset / miter sliders and chips, plus arrow head-scale, use the same overlay. `strokeGhost` is not written to localStorage and clears on select change.

- Arrow head-scale hover ghost: mixed head chips hover or focus a phosphor overlay on selected arrows using that chip’s `headScale`. Dragging the Head slider paints the same overlay. `strokeGhost.headScale` is ephemeral (cleared on select change, pointer leave, blur) and not written to localStorage. Non-arrow outlines are skipped so only chevrons reshape.

- Slider drag ghosts: width, dash, offset, and miter range sliders paint a phosphor overlay on selected outlines while dragging. Mixed width / offset / miter / dash chips hover the same overlay. `strokeGhost` is ephemeral (cleared on select change) and not written to localStorage.

- Arrow heads as true paths on canvas: drawNode and fill silhouettes use `arrowPath` built from `arrowPoints(w, h, headScale)`. Export, boolean ops, and stroke ghosts share the same contour, so head scale changes the chevron instead of painting a rectangle.

## Iteration

2026-09-17 01:32 BST — Mixed fill-rule chip hover ghost on holed paths.

## Next recommended

Mixed width / dash / offset chip hover ghosts if still unwired; otherwise present-mode safe-area contrast.
