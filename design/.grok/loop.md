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

1. Command-palette print-mark and safe-area commands.
2. Drag rulers to place guides.

## Done

- Inspector guides + custom bleed per edge: T/R/B/L fields, uniform slider, live asymmetric bleed band, persistent dashed guides, print-mark toggle in inspector and top bar. Print PNG uses per-edge paper pads and draws crop marks.
- Inspector bleed / print-mark overlay: live bleed band when bleed > 0, crop + registration marks when Print marks is on. Wired `drawSafeArea` onto the artboard (it was unused). Present chrome Safe / Marks toggles. Print PNG export now actually draws crop marks. Prefs persist in localStorage.
- Mixed shadow chip hover ghosts.
- Present-mode and editor safe-area overlay.
- Mixed width / dash / offset slider and chip hover ghosts.
- Mixed fill-rule chip hover ghost on paths with holes.
- Corner-radius hover ghost on mixed rectangles.
- Sides hover ghost on mixed polygons / stars.
- Mixed cap / join chip hover ghost.
- Arrow head-scale hover ghost.
- Slider drag ghosts (partial; now wired on canvas).
- Arrow heads as true paths on canvas.

## Iteration

2026-09-17 11:20 BST — Inspector guides and per-edge bleed.

## Next recommended

Command-palette print-mark and safe-area commands.
