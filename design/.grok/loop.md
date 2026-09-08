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

1. Path inspector: keep Points list scroll when Shift+Tab walks from a hole header onto the first hole’s last outer-path point while the list is mid-scroll.

## Done

- Path inspector keeps Points list scroll when Shift+Tab walks from a hole header onto the previous hole’s last point. `shouldShiftTabToPrevHoleLastPoint` / `pickPrevHoleLastPointTabTarget` focus that hole's last y field, `tagHolePointTabCrossing` marks `data-hole-point`, and `shouldHoldPointListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Tab walks from a hole header onto the first point of the same hole. `shouldTabToSameHoleFirstPoint` / `pickSameHoleFirstPointTabTarget` focus that hole's first x field, `tagHolePointTabCrossing` marks `data-hole-point`, and `shouldHoldPointListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Shift+Tab walks from a hole’s first x onto that hole’s header. `shouldShiftTabToSameHoleHeader` / `pickSameHoleHeaderTabTarget` focus the matching `[data-select-hole]`, `isCrossingHolePointToHeaderTab` + `tagHolePointTabCrossing` mark `data-hole-point` on the header, and the Points list restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Tab walks from a hole header onto the last point of the same hole. `pickSameHoleLastPointTabTarget` focuses that hole's last x field, `isCrossingHoleHeaderToPointTab` now treats same-hole header→point as a crossing, `tagHolePointTabCrossing` marks `data-hole-point`, and `shouldHoldPointListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Tab walks from a hole header onto the first point of the next hole. `pickNextHolePointTabTarget` focuses that hole's first x field, `tagHolePointTabCrossing` now also marks header→point crossings with `data-hole-point`, and `shouldHoldPointListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Holes list scroll when Tab walks from Delete hole onto the next hole header. `pickNextHoleTabTarget` focuses the next card header, `tagHoleHeaderTabCrossing` marks `data-hole-header-tab`, and `shouldHoldHoleListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Holes list scroll when Shift+Tab walks from a hole header into the previous hole. `pickPreviousHoleTabTarget` focuses the previous card's last control, `tagHoleHeaderTabCrossing` marks `data-hole-header-tab`, and `shouldHoldHoleListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Shift+Tab walks from a hole point back into the previous hole. `tagHolePointTabCrossing` clears the stale `data-hole-point` mark, tags the previous-hole destination, and `shouldHoldPointListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Tab walks from a hole’s last y onto the next hole header. `shouldTabToNextHoleHeader` / `pickNextHoleHeaderTabTarget` focus the next `[data-select-hole]`, `isCrossingHolePointToHeaderTab` now treats point→header across holes as a crossing, `tagHolePointTabCrossing` marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.

## Iteration

2026-09-08 04:05 BST — Points list scroll holds when Shift+Tab walks from a hole header onto the previous hole’s last point mid-list.

## Next recommended

Path inspector: keep Points list scroll when Shift+Tab walks from a hole header onto the first hole’s last outer-path point while the list is mid-scroll.
