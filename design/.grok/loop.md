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

1. Path inspector: keep Points list scroll when Tab walks from Simplify onto the first outer-path point mid-list.

## Done

- Path inspector keeps Points list scroll when Tab walks from Round onto Simplify while Points is mid-scroll. `shouldTabFromRoundToSimplify` / `pickSimplifyTabTarget` focus Simplify, `tagHolePointTabCrossing` treats exit → exit as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.


- Path inspector keeps Points list scroll when Tab walks from Outline onto Round while Points is mid-scroll. `shouldTabFromOutlineToRound` / `pickRoundTabTarget` focus Round, `tagHolePointTabCrossing` treats exit → exit as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Tab walks from Offset onto Outline while Points is mid-scroll. `shouldTabFromOffsetToOutline` / `pickOutlineTabTarget` focus Outline, `tagHolePointTabCrossing` treats exit → exit as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.


- Path inspector keeps Points list scroll when Tab walks from Closed onto Offset while Points is mid-scroll. `shouldTabFromClosedToOffset` / `pickOffsetTabTarget` focus Offset, `tagHolePointTabCrossing` treats exit → exit as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Shift+Tab walks from the first outer-path x onto Offset while the list is mid-scroll. `shouldShiftTabFromFirstOuterToOffset` / `pickOffsetTabTarget` focus Offset, `tagHolePointTabCrossing` treats point → `data-path-exit` as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Tab walks from Offset onto the first outer-path point mid-list. `shouldTabFromOffsetToFirstOuterPoint` / `pickFirstOuterPointTabTarget` focus that point's first x, `tagHolePointTabCrossing` treats `data-path-exit` → point as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`.

## Iteration

2026-09-08 14:34 BST — Points list scroll holds when Tab walks from Round onto Simplify mid-list.

## Next recommended

Path inspector: keep Points list scroll when Tab walks from Simplify onto the first outer-path point mid-list.
