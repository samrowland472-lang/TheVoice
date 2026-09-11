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

1. Path inspector Tab from last hole-path x lands on the next hole header when last hole y is missing and the next hole has no point fields.

## Done

- Path inspector Tab from last outer-path x lands on the first hole header when last y is missing and hole 0 has no point fields. `shouldTabFromLastOuterXToFirstHoleHeader` + `lastOuterXToFirstHoleHeader` skip when last y or first-hole x/y exist. `focusFirstHoleHeader` + `focusHoldEl` hold Points and Holes list scroll.

- Path inspector Shift+Tab from first hole header onto last outer-path x when last y is missing and hole 0 has no point fields. `shouldShiftTabFromFirstHoleHeaderToLastOuterX` prefers last y when present. `pickLastOuterLastPointXTabTarget` + `focusHold` holds Points and Holes list scroll.

- Path inspector Shift+Tab from first hole header onto last outer-path y when hole 0 has no point fields. `shouldShiftTabFromFirstHoleHeaderToLastOuterY` + `firstHoleHeaderToLastOuterY` + `pickLastOuterLastPointYTabTarget`; first-hole x/y still preferred when present. Holds Points and Holes list scroll.

- Path inspector Tab from last outer-path y lands on the first hole header when hole 0 has no point fields. Restored `path-point-tab-last-y.ts`. `shouldTabFromLastOuterYToFirstHoleHeader` + `pickFirstHoleHeaderTabTarget` / `focusFirstHoleHeader`; first hole x/y still preferred when present. Holds Points and Holes list scroll.

- Path inspector Shift+Tab from first hole-path y lands on last outer-path x when last outer y is missing and first hole x is missing. Restored `path-point-tab-last-y.ts` (`shouldShiftTabFromFirstHoleYToLastOuterX` prefers last y when present). `focusLastOuterLastX` holds Points and Holes list scroll.

- Path inspector Tab from last outer-path y lands on first hole-path y when first hole x is missing and holds Points and Holes list scroll after growth. `shouldTabFromLastOuterYToFirstHoleY` + `focusFirstHoleFirstY` / `pickFirstHoleFirstPointYTabTarget`; first-x still preferred when present.

## Iteration

2026-09-11 10:20 BST — Tab from last outer-path x to first hole header when last y is missing and hole 0 has no point fields.

## Next recommended

Path inspector Tab from last hole-path x lands on the next hole header when last hole y is missing and the next hole has no point fields.
