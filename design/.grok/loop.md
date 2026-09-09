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

1. Path inspector: Tab from last hole-path x of hole N onto hole N+1 first-point x while both lists stay mid-scroll after growth.

## Done

- Path inspector Tab from last hole-path y of hole N lands on hole N+1 first-point x and holds Points and Holes list scroll after growth. `shouldTabFromLastHoleYToNextFirstX` + `pickNextHoleFirstPointXTabTarget`; point-to-point `holdPointAndHoleLists`; `focus({ preventScroll: true })` + double-rAF restore.

- Path inspector Shift+Tab from first hole-path y of hole N+1 lands on hole N header without jumping scroll when Points and Holes lists grow. `shouldShiftTabToPrevHoleHeader` now accepts first-point x or y; `pickPrevHoleHeaderTabTarget`; `header.focus({ preventScroll: true })`; double-rAF restore; `holdPointAndHoleLists` snapshots both lists.

- Path inspector Shift+Tab from first hole-path x of hole N+1 lands on hole N header without jumping scroll when Points and Holes lists grow. `shouldShiftTabToPrevHoleHeader` + `pickPrevHoleHeaderTabTarget`; `header.focus({ preventScroll: true })`; double-rAF restore; `holdPointAndHoleLists` snapshots both lists. Restored `shouldTabFromLastHoleXToNextHeader`.

- Path inspector Tab from last hole-path y of hole N lands on hole N+1 header without jumping scroll when Points and Holes lists grow. `shouldTabToNextHoleHeader` + `header.focus({ preventScroll: true })`; `restoreListScroll` double-rAF + clamp; `holdPointAndHoleLists` still snapshots both lists.

- Path inspector Tab from last hole-path x of hole N lands on the header of hole N+1 and holds both Points and Holes list scroll when mid-scroll. `shouldTabFromLastHoleXToNextHeader` + `pickNextHoleHeaderTabTarget`; `tagHolePointTabCrossing` + `holdPointAndHoleLists` restore both `scrollTop`s.

- Path inspector Shift+Tab from hole header N+1 lands on last hole-path x of hole N and holds both Points and Holes list scroll when mid-scroll. `pickPrevHoleLastPointTabTarget` prefers `data-path-axis="x"` on the last row of hole N (y fallback); `tagHolePointTabCrossing` + `focusHold` restore Points and Holes `scrollTop`.

- Path inspector Shift+Tab from hole header N+1 lands on last hole-path y of hole N and holds both Points and Holes list scroll when mid-scroll. `shouldShiftTabToPrevHoleLastPoint` / `pickPrevHoleLastPointTabTarget` still own the target (y preferred); `tagHolePointTabCrossing` now treats header → point as a hold and calls `holdPointAndHoleLists` so both `scrollTop`s restore instead of `scrollIntoView`.

## Iteration

2026-09-09 23:07 BST — Tab from last hole-path y of hole N lands on hole N+1 first-point x and holds Points and Holes list scroll after list growth.

## Next recommended

Path inspector: Tab from last hole-path x of hole N onto hole N+1 first-point x while both lists stay mid-scroll after growth.
