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

1. Path inspector Shift+Tab from the next hole first X onto the previous hole fill-rule chip when the previous hole has no point fields and the current hole still has point fields.

## Done

- Path inspector Shift+Tab from the next hole first Y onto the previous hole fill-rule chip when the previous hole has no point fields, the current hole still has point fields, and the current first X is missing. `shouldShiftTabFromNextHoleFirstYToLastHoleFill` / `pickLastHoleFillFromFirstYTabTarget` resolve `[data-hole="${h-1}"] [data-hole-fill]`. Yields to last-hole Y/X hops and header→fill. Document-level Shift+Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, lastFill, lastFill)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Tab from a hole fill-rule chip onto the next hole first Y when the current hole has no point fields, the next hole still has point fields, and the next first X is missing. `shouldTabFromHoleFillToNextFirstY` / `pickNextHoleFirstPointYFromFillTabTarget` resolve `[data-point^="hole-${h+1}-"] input[data-path-axis="y"]`. Yields to `shouldTabFromHoleFillToNextFirstX` when the next first X exists, and to `shouldTabFromHoleFillToNextHeader` when both holes are empty. Document-level Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, nextY, nextY)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Tab from a hole fill-rule chip onto the next hole first-point X when the current hole has no point fields and the next hole still has an X field. `shouldTabFromHoleFillToNextFirstX` / `pickNextHoleFirstPointXFromFillTabTarget` resolve `[data-point^="hole-${h+1}-"] input[data-path-axis="x"]`. Yields to `shouldTabFromHoleFillToNextHeader` when both holes are empty. Document-level Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, nextX, nextX)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Shift+Tab from the next hole fill-rule chip onto the previous hole delete control when the previous hole has no point fields. `shouldShiftTabFromNextHoleFillToLastHoleDelete` / `pickLastHoleDeleteFromFillTabTarget` resolve `[data-hole="${h-1}"] [data-delete-hole]`. Yields to header→delete and header→fill hops. Document-level Shift+Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, lastDelete, lastDelete)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Tab from a hole delete control onto the next hole fill-rule chip when the current hole has no point fields (and the next hole still has point fields, so the empty-header hop does not apply). `shouldTabFromHoleDeleteToNextFill` / `pickNextHoleFillFromDeleteTabTarget` resolve `[data-hole="${h+1}"] [data-hole-fill]`. Yields to `shouldTabFromHoleDeleteToNextHeader` when both holes are empty. Document-level Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, nextFill, nextFill)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Shift+Tab from the next empty hole header onto the previous hole delete control when both holes have no point fields.

- Path inspector Tab from a hole delete control onto the next empty hole header when both holes have no point fields.

- Path inspector Shift+Tab from the next empty hole header onto the previous hole fill-rule chip when both holes have no point fields.

## Iteration

2026-09-13 02:21 BST — Shift+Tab from next hole first Y onto previous hole fill-rule when previous hole has no point fields, current first X is missing; hold Holes list scroll.

## Next recommended

Wire Shift+Tab from the next hole first X onto the previous hole fill-rule chip when the previous hole has no point fields and the current hole still has point fields.
