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

1. Path inspector: expose per-hole fill-rule when a compound path is selected.

## Done

- Inspector ShadowEditor live preview chip: a 7×7 surface next to Add/Clear uses `shadowPreviewCss` so drop vs inset, colour, blur, offset, and spread show as a real CSS `box-shadow` while sliders move. Header names Shadow · drop vs Shadow · inset. Restored `esc()` entities in export.ts so typecheck can parse.

- True inner-shadow on the artboard: destination-out of an offset silhouette, then destination-in clip to the node. Drop shadows still use `canvasShadowParams`; inset no longer flips canvas offsets. Shared params keep authored ox/oy so SVG `operator="out"` and PNG raster match the board. Restored `esc()` entities in export.ts so typecheck passes.

- SVG and PNG export honor shadow spread and inset the same way the artboard does. Shared `canvasShadowParams` fattens blur by spread; the canvas renderer and PNG rasterizer both use it. SVG export emits per-layer filters: drop shadows dilate by spread then blur, inset shadows composite `out` of the source alpha. Rebuilt the truncated MixedInk panel so typecheck and mixed-shadow chips stay live.

- Inspector mixed shadow spread / inset: a fifth field. Chips name `s8` and `inset` / `drop` when those disagree; sliders and the inset checkbox write only that field through `mapShadows` / `stampShadowSpread` / `stampShadowInset` so colour, blur, and offset stay put. Rebuilt the truncated MixedInk panel so mixed sliders stay live.

- Inspector mixed shadow sliders stay live while colour and offset disagree: the first drop is a ghost value only. Colour, blur, ox, and oy sliders stamp that field through `mapShadows` so the rest of each drop stays put.

- Inspector ShadowEditor single-node spread / inset: colour, blur, X, Y, spread sliders and an Inset checkbox match the mixed panel. Writes go through stamp helpers so spread and inset persist with the rest of the drop. Restored SVG `esc()` entities in export.ts so typecheck passes.

## Iteration

2026-09-05 15:20 BST — Inspector ShadowEditor live inset vs drop preview chip.

## Next recommended

Path inspector: expose per-hole fill-rule when a compound path is selected.
