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

1. Path inspector Tab from a hole delete control onto the next empty hole header when both holes have no point fields, holding the Holes list mid-scroll after growth.

## Done

- Path inspector Shift+Tab from the next empty hole header onto the previous hole fill-rule chip when both holes have no point fields. `shouldShiftTabFromNextHoleHeaderToLastHoleFill` / `pickLastHoleFillFromHeaderTabTarget` skip last-y and last-x hops, require no point fields on either hole, and resolve the last `[data-hole-fill]` in the previous hole. Last-header Shift+Tab skips when this hop applies. Live header in `inspector-path-impl` hops with `tagHoleHeaderTabCrossing(from, lastFill, lastFill)` then `focusHold(lastFill, "[data-hole-list]", from)` holds Holes list scroll after growth.

- Path inspector Tab from a hole fill-rule chip onto the next empty hole header when the current hole has no point fields. `shouldTabFromHoleFillToNextHeader` / `pickNextHoleHeaderFromFillTabTarget` require both holes to have no point fields and resolve the next header from `[data-hole-fill]`. Live fill chips in `inspector-path-impl` hop with `tagHoleHeaderTabCrossing(from, nextHeader, nextHeader)` then `focusHold(nextHeader, "[data-hole-list]", from)` holds Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole header onto the previous empty hole header when both holes have no point fields. `shouldShiftTabFromNextHoleHeaderToLastHoleHeader` / `pickLastHoleHeaderFromHeaderTabTarget` skip when last hole y or x fields exist and run after those hops in `inspector-path-impl`. `tagHoleHeaderTabCrossing(from, prevHeader, prevHeader)` then `focusHold(prevHeader, "[data-hole-list]", from)` holds Holes list scroll after growth. Also wired live last-header Tab onto next first y and next header.

- Path inspector Tab from an empty last-hole header onto the next hole header when the next hole also has no point fields. `shouldTabFromLastHoleHeaderToNextHeader` / `pickNextHoleHeaderFromHeaderTabTarget` skip when next first x or y exists and run after those hops in `inspector-path-impl`. `tagHoleHeaderTabCrossing(from, nextHeader, nextHeader)` then `focusHold(nextHeader, "[data-hole-list]", from)` holds Holes list scroll after growth. Also wired live `shouldTabFromLastHoleHeaderToNextFirstY` / `pickNextHoleFirstPointYFromHeaderTabTarget`.

- Path inspector Tab from an empty last-hole header onto the next hole first-point y on the live header control (`focusNextHoleFirstYFromHeader`). `shouldTabFromLastHoleHeaderToNextFirstY` / `pickNextHoleFirstPointYFromHeaderTabTarget` skip when next first x exists and run after the first-x hop in `inspector-path-impl`. `tagHolePointTabCrossing(from, nextY, nextY)` then `focusHold(nextY, "[data-point-list]", from)` holds Points and Holes list scroll after growth.

- Path inspector Tab from an empty last-hole header onto the next hole first-point x on the live header control. `shouldTabFromLastHoleHeaderToNextFirstX` / `pickNextHoleFirstPointXFromHeaderTabTarget` run after same-hole first-point in `inspector-path-impl`. `tagHolePointTabCrossing(from, nextX, nextX)` then `focusHold(nextX, "[data-point-list]", from)` holds Points and Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole first-point y onto the last hole header when the last hole has no point fields. Live `focusPrevHoleLastHeader` in `path-point-row-view` uses `shouldShiftTabFromNextHoleFirstYToLastHoleHeader` / `shouldShiftTabFromNextHoleFirstXToLastHoleHeader` and `pickLastHoleHeaderTabTarget`. Hop runs after last-y and last-x, before same-hole header. `focusHoldEl` holds Points and Holes list scroll after growth.

- Path inspector Tab from the last hole header onto the next hole first-point x when the last hole has no point fields. `shouldTabFromLastHoleHeaderToNextFirstX` skips when the current hole still has x/y fields. `pickNextHoleFirstPointXFromHeaderTabTarget` resolves the next hole first x from the header. Header Tab in `inspector-path-impl` hops after same-hole first-point. `focusHold` keeps Points and Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole first-point x onto the last hole header when the last hole has no point fields. `shouldShiftTabFromNextHoleFirstXToLastHoleHeader` skips when last hole y or x fields exist. `pickLastHoleHeaderTabTarget` resolves the previous hole header from the point key. `focusPrevHoleLastHeader` prefers that hop after last-y and last-x. `focusHoldEl` holds Points and Holes list scroll after growth.

- Path inspector Shift+Tab from the next hole first-point y onto last hole-path x when last hole y is missing. `shouldShiftTabFromNextHoleFirstYToLastHoleX` skips when last y exists. `pickLastHoleLastPointXTabTarget` resolves the previous hole from the point key. `focusPrevHoleLastX` prefers that hop, then first-x last-x and first-hole x pickers. `focusHoldEl` holds Points and Holes list scroll after growth.

## Iteration

2026-09-12 12:28 BST — Shift+Tab from next empty hole header onto previous hole fill-rule chip; hold Holes list scroll.

## Next recommended

Wire Tab from a hole delete control onto the next empty hole header when both holes have no point fields, holding Holes list mid-scroll.
