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

1. Path inspector: wire Shift+Tab from first outer-path x onto Offset in the point row so the list keeps scroll when Outline is not taken.

## Done

- Path inspector keeps Points list scroll when Shift+Tab walks from the first outer-path x onto Outline while the list is mid-scroll. `shouldShiftTabFromFirstOuterToOutline` / `pickOutlineTabTarget` focus Outline, `tagHolePointTabCrossing` treats point → `data-path-exit` as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`. Restored missing `shouldShiftTabFromFirstOuterToRound`.

## Iteration

2026-09-08 23:28 BST — Points list scroll holds when Shift+Tab walks from the first outer-path x onto Outline mid-list.

## Next recommended

Path inspector: wire Shift+Tab from first outer-path x onto Offset in the point row so the list keeps scroll when Outline is not taken.
