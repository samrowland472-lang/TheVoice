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

1. Path inspector: Shift+Tab from first outer-path x onto Closed when Offset and Outline are both absent, holding Points list scroll.

## Done

- Path inspector keeps Points list scroll when Shift+Tab walks from the first outer-path x onto Outline while the list is mid-scroll. `shouldShiftTabFromFirstOuterToOutline` / `pickOutlineTabTarget` focus Outline, `tagHolePointTabCrossing` treats point → `data-path-exit` as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`. Restored missing `shouldShiftTabFromFirstOuterToRound`.
- Path inspector Shift+Tab from first outer-path x lands on Offset when Outline is not present. `shouldShiftTabFromFirstOuterToOffset` refuses the hop if Outline exists; `path-point-row` focuses Offset via `pickOffsetTabTarget`, tags the crossing, and restores Points `scrollTop`. Restored missing `shouldShiftTabFromFirstOuterToOutline` (typecheck export).

## Iteration

2026-09-09 00:15 BST — Shift+Tab from first outer-path x focuses Offset when Outline is not taken; Points list scroll holds.

## Next recommended

Path inspector: Shift+Tab from first outer-path x onto Closed when Offset and Outline are both absent, holding Points list scroll.
