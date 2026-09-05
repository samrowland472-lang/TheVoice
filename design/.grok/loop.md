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

1. True inner-shadow clip (destination-in) instead of flipped offsets.
2. Inspector ShadowEditor single-node spread / inset sliders matching mixed panel.

## Done

- SVG and PNG export honor shadow spread and inset the same way the artboard does. Shared `canvasShadowParams` fattens blur by spread and flips inset offsets; the canvas renderer and PNG rasterizer both use it. SVG export now emits per-layer filters: drop shadows dilate by spread then blur, inset shadows composite `out` of the source alpha. Rebuilt the truncated MixedInk panel so typecheck and mixed-shadow chips stay live.

- Inspector mixed shadow spread / inset: a fifth field. Chips name `s8` and `inset` / `drop` when those disagree; sliders and the inset checkbox write only that field through `mapShadows` / `stampShadowSpread` / `stampShadowInset` so colour, blur, and offset stay put. Rebuilt the truncated mixed-ink panel so mixed sliders stay live.

- Inspector mixed shadow sliders stay live while colour and offset disagree: the first drop is a ghost value only. Colour, blur, ox, and oy sliders stamp that field through `mapShadows` so the rest of each drop stays put.

## Iteration

2026-09-05 — SVG/PNG export shadow spread + inset (artboard mapping). MixedInk restored.

## Next recommended

True inner-shadow on the artboard with destination-in clip instead of flipped canvas offsets.
