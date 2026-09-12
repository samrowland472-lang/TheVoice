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

1. Path inspector Tab from a hole delete control onto the next hole fill-rule chip when the current hole has no point fields.

## Done

- Path inspector Shift+Tab from the next empty hole header onto the previous hole delete control when both holes have no point fields. `shouldShiftTabFromNextHoleHeaderToLastHoleDelete` / `pickLastHoleDeleteFromHeaderTabTarget` resolve `[data-hole="${h-1}"] [data-delete-hole]`. Fill-rule Shift+Tab yields when delete is present. Document-level Shift+Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, lastDelete, lastDelete)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Tab from a hole delete control onto the next empty hole header when both holes have no point fields. `shouldTabFromHoleDeleteToNextHeader` / `pickNextHoleHeaderFromDeleteTabTarget` require no point fields on either hole and resolve the next header from `[data-delete-hole]`. Document-level Tab in `inspector-path` hops with `tagHoleHeaderTabCrossing(from, nextHeader, nextHeader)` and restores `[data-hole-list]` scroll after growth.

- Path inspector Shift+Tab from the next empty hole header onto the previous hole fill-rule chip when both holes have no point fields.

## Iteration

2026-09-12 14:20 BST — Shift+Tab from next empty hole header onto previous hole delete; hold Holes list scroll.

## Next recommended

Wire Tab from a hole delete control onto the next hole fill-rule chip when the current hole has no point fields.
