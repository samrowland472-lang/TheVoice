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

1. Path inspector: Tab from last hole-path x of hole N onto first hole-path y of hole N+1 while both lists stay mid-scroll after growth.

## Done

- Path inspector Tab from last hole-path y of hole N lands on first hole-path y of hole N+1 and holds Points and Holes list scroll after growth. `shouldTabFromLastHoleYToNextFirstY` + `focusNextHoleFirstY` / `pickNextHoleFirstPointYTabTarget`; last-y still falls through to next first x when no first y.

- Path inspector Shift+Tab from first hole-path y of hole N+1 lands on last hole-path y of hole N and holds Points and Holes list scroll after growth. `shouldShiftTabFromFirstHoleYToPrevLastY` + `focusPrevHoleLastY` / `pickPrevHoleLastPointYTabTarget`; first-y still falls through to prev last x when no last y, then same/prev header.

- Path inspector Shift+Tab from first hole-path y of hole N+1 lands on last hole-path x of hole N and holds Points and Holes list scroll after growth.

- Path inspector Shift+Tab from first hole-path x of hole N+1 lands on last hole-path x of hole N and holds Points and Holes list scroll after growth.

## Iteration

2026-09-10 08:19 BST — Tab from last hole-path y of hole N lands on first hole-path y of hole N+1 and holds Points and Holes list scroll after list growth.

## Next recommended

Path inspector: Tab from last hole-path x of hole N onto first hole-path y of hole N+1 while both lists stay mid-scroll after growth.
