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

1. Path inspector Tab from last outer-path x onto first hole-path y when first hole x is missing.

## Done

- Path inspector outer-ring wrap: Shift+Tab from first hole-path y lands on last outer-path x when last y is missing and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleYToLastOuterX` + `focusLastOuterLastX` / `pickLastOuterLastPointXTabTarget`; last-y still preferred when present.

- Path inspector Shift+Tab from first hole-path x lands on last outer-path x when last y is missing and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleXToLastOuterX` + `focusLastOuterLastX` / `pickLastOuterLastPointXTabTarget`; last-y still preferred when present.

- Path inspector Shift+Tab from first hole-path y lands on last outer-path y and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleYToLastOuterY` + `focusLastOuterLastY` / `pickLastOuterLastPointYTabTarget`.

- Path inspector Shift+Tab from first hole-path x lands on last outer-path y and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleXToLastOuterY` + `focusLastOuterLastY` / `pickLastOuterLastPointYTabTarget`.

- Path inspector Tab from last outer-path y lands on first hole-path x and holds Points and Holes list scroll after growth. `shouldTabFromLastOuterYToFirstHoleX` + `focusFirstHoleFirstX` / `pickFirstHoleFirstPointXTabTarget`.

- Path inspector Shift+Tab from first hole-path x of hole N+1 lands on last hole-path y of hole N and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleXToPrevLastY` + `focusPrevHoleLastY`; last-x only when no last y.

- Path inspector Tab from last hole-path x of hole N lands on first hole-path y of hole N+1 and holds Points and Holes list scroll after growth. `shouldTabFromLastHoleXToNextFirstY` + `focusNextHoleFirstY`; last-x falls through to next first x when no first y.

- Path inspector Tab from last hole-path y of hole N lands on first hole-path y of hole N+1 and holds Points and Holes list scroll after growth. `shouldTabFromLastHoleYToNextFirstY` + `focusNextHoleFirstY` / `pickNextHoleFirstPointYTabTarget`; last-y still falls through to next first x when no first y.

- Path inspector Shift+Tab from first hole-path y of hole N+1 lands on last hole-path y of hole N and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleYToPrevLastY` + `focusPrevHoleLastY` / `pickPrevHoleLastPointYTabTarget`; first-y still falls through to prev last x when no last y, then same/prev header.

- Path inspector Shift+Tab from first hole-path y of hole N+1 lands on last hole-path x of hole N and holds Points and Holes list scroll after growth.

- Path inspector Shift+Tab from first hole-path x of hole N+1 lands on last hole-path x of hole N and holds Points and Holes list scroll after growth.

## Iteration

2026-09-10 16:22 BST — Shift+Tab from first hole-path y lands on last outer-path x when last y is missing and holds Points and Holes list scroll after list growth.

## Next recommended

Path inspector Tab from last outer-path x onto first hole-path y when first hole x is missing.
