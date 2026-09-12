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

1. Path inspector Shift+Tab from the next hole first-point y onto the last hole header when the last hole has no point fields while both lists stay mid-scroll after growth (wire `focusPrevHoleLastHeader` in the live view if comments-only).

## Done

- Path inspector Tab from the last hole header onto the next hole first-point x when the last hole has no point fields. `shouldTabFromLastHoleHeaderToNextFirstX` skips when the current hole still has x/y fields. `pickNextHoleFirstPointXFromHeaderTabTarget` resolves the next hole first x from the header. Header Tab in `inspector-path-impl` hops after same-hole first-point. `focusHold` keeps Points and Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole first-point x onto the last hole header when the last hole has no point fields. `shouldShiftTabFromNextHoleFirstXToLastHoleHeader` skips when last hole y or x fields exist. `pickLastHoleHeaderTabTarget` resolves the previous hole header from the point key. `focusPrevHoleLastHeader` prefers that hop after last-y and last-x. `focusHoldEl` holds Points and Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole first-point y onto the last hole header when the last hole has no point fields. `shouldShiftTabFromNextHoleFirstYToLastHoleHeader` skips when last hole y or x fields exist. `pickLastHoleHeaderTabTarget` resolves the previous hole header from the point key. `focusPrevHoleLastHeader` prefers that hop before same-hole header. `focusHoldEl` holds Points and Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole first-point y onto last hole-path x when last hole y is missing. `shouldShiftTabFromNextHoleFirstYToLastHoleX` skips when last y exists. `pickLastHoleLastPointXTabTarget` resolves the previous hole from the point key. `focusPrevHoleLastX` prefers that hop, then first-x last-x and first-hole x pickers. `focusHoldEl` holds Points and Holes list scroll after growth.

## Iteration

2026-09-12 03:15 BST — Tab from last hole header to next hole first-point x when last hole has no point fields; hold Points and Holes list scroll.

## Next recommended

Wire `focusPrevHoleLastHeader` in the live point-row view so Shift+Tab from next hole first-point y lands on the last empty hole header while both lists stay mid-scroll.
