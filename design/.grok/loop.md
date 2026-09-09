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

1. Path inspector: Shift+Tab from first hole-path y onto the hole header when the list is mid-scroll.

## Done

- Path inspector Shift+Tab from first hole-path x lands on that hole header and holds both Points and Holes list scroll. `shouldShiftTabToSameHoleHeader` still requires point index 0 and axis x; the x field tags point and header crossings, restores both `scrollTop`s, and `shouldHoldHoleListScroll` treats a focused hole header as a hold.

- Path inspector Shift+Tab from first outer-path y lands on the same previous control the x hop already left (Outline, then Offset, Closed, Round, Simplify). Axis checks accept `y`; `path-point-row` y field runs the same pickers, tags the crossing, and restores Points `scrollTop`.

- Path inspector Shift+Tab from first outer-path x lands on Simplify when Closed, Offset, Outline, and Round are not present. `shouldShiftTabFromFirstOuterToSimplify` refuses the hop if any of those four exists; `path-point-row` focuses Simplify via `pickSimplifyTabTarget`, tags the crossing, and restores Points `scrollTop`.

- Path inspector Shift+Tab from first outer-path x lands on Round when Closed, Offset, and Outline are not present. `shouldShiftTabFromFirstOuterToRound` refuses the hop if any of those three exists; `path-point-row` focuses Round via `pickRoundTabTarget`, tags the crossing, and restores Points `scrollTop`. Closed is wired ahead of Round via `shouldShiftTabFromFirstOuterToClosed` / `pickClosedTabTarget`.
- Path inspector Shift+Tab from first outer-path x lands on Closed when Offset and Outline are not present. `shouldShiftTabFromFirstOuterToClosed` refuses the hop if either Offset or Outline exists; `path-point-row` focuses Closed via `pickClosedTabTarget`, tags the crossing, and restores Points `scrollTop`.
- Path inspector keeps Points list scroll when Shift+Tab walks from the first outer-path x onto Outline while the list is mid-scroll. `shouldShiftTabFromFirstOuterToOutline` / `pickOutlineTabTarget` focus Outline, `tagHolePointTabCrossing` treats point → `data-path-exit` as a crossing and marks `data-hole-point`, and the Points list restores `scrollTop` instead of `scrollIntoView`. Restored missing `shouldShiftTabFromFirstOuterToRound`.
- Path inspector Shift+Tab from first outer-path x lands on Offset when Outline is not present. `shouldShiftTabFromFirstOuterToOffset` refuses the hop if Outline exists; `path-point-row` focuses Offset via `pickOffsetTabTarget`, tags the crossing, and restores Points `scrollTop`. Restored missing `shouldShiftTabFromFirstOuterToOutline` (typecheck export).

## Iteration

2026-09-09 07:15 BST — Shift+Tab from first hole-path x lands on the hole header and holds Points and Holes list scroll.

## Next recommended

Path inspector: Shift+Tab from first hole-path y onto the hole header when the list is mid-scroll.
