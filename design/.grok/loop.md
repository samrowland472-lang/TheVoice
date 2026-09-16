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

1. Mixed-kind dash preview on the canvas itself (ghost dash overlay while hovering a rhythm chip).

## Done

- Per-kind width chips: when a mixed outline pick disagrees on stroke width, each selected path/rect/ellipse/line/polygon/star/arrow shows a width chip; clicking stamps that outline’s strokeWidth onto every outline in the pick. Hairline (0) labels as hair.

- Per-kind dash / cap / join preview chips: when a mixed outline pick disagrees on dash, cap, or join, each selected path/rect/ellipse/line/polygon/star/arrow shows chips plus a combined rhythm chip. Clicking stamps that outline’s dash, cap, and/or join onto every outline in the pick. Offset and miter chips still stamp those fields. Sides write onto polygons/stars only; head scale onto arrows only. Arrows paint and export as heads (`headScale`).

## Iteration

2026-09-16 10:15 BST — Per-kind width unify chips on mixed outline picks.

## Next recommended

Mixed-kind dash preview on the canvas itself (ghost dash overlay while hovering a rhythm chip).
