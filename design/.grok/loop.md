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

1. Drag rulers to place guides (canvas rulers still missing).
2. Print-mark toggle in inspector / top bar drawing crop marks on canvas.

## Done

- Inspector guide list: add V/H, drag the axis handle to move, numeric pos, clear. Live dashed guides on the artboard. T/R/B/L bleed fields + None/3 mm/6 mm chips; `setBleed` / `setBleedEdges` write per-edge pads; live bleed band drawn on canvas.
- Bleed preset polish: inspector None / 3 mm / 6 mm chips highlight the live uniform bleed; `setBleed` writes matching `bleedEdges`; command palette uses `bleedMmToPx`.
- Command-palette bleed presets (none / 3 mm / 6 mm). Inspector chips match. `setBleed` writes uniform `bleedEdges`. 96 CSS-dpi millimetre conversion in `print-marks.ts`.
- Drag rulers to place guides. Top ruler pulls a horizontal guide; left ruler pulls a vertical guide. Drag a guide to move it; drop back on the ruler or off the board to delete. Persistent cyan dashed guides draw on the artboard. Phosphor tick rulers in screen space.
- Command palette print-mark and safe-area commands (show / hide / on / off). Prefs persist. Canvas and print PNG draw crop marks + safe area. Inspector T/R/B/L bleed fields and print-mark toggle. Broken SVG `esc()` literals and typecheck holes fixed.
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

2026-09-17 15:35 BST — Inspector guide drag + T/R/B/L bleed on live canvas band.

## Next recommended

Drag rulers to place guides on the artboard.
