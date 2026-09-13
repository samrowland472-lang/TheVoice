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

1. Path inspector Shift+Tab from the first hole header onto the last outer path point X when wrap is off and last Y is missing.

## Done

- Path inspector Tab from the last outer path point X onto the first hole header when wrap is off and last Y is missing. Document-level Tab in `inspector-path` hops with `shouldTabFromLastOuterYToFirstHoleHeader` **or** `shouldTabFromLastOuterXToFirstHoleHeader` / `pickFirstHoleHeaderTabTarget`, `tagHoleHeaderTabCrossing(from, header, header)`, `focus({ preventScroll: true })`, and restores `[data-hole-list]` scroll after growth. Yields to last-outer Y and first-hole X/Y hops when those fields exist (`lastOuterXToFirstHoleHeader` returns false when the last outer row still has a Y input).

- Path inspector Tab from the last outer path point Y onto the first hole header when wrap is off (first hole has no point fields). Document-level Tab in `inspector-path` hops with `shouldTabFromLastOuterYToFirstHoleHeader` / `pickFirstHoleHeaderTabTarget`, `tagHoleHeaderTabCrossing(from, header, header)`, `focus({ preventScroll: true })`, and restores `[data-hole-list]` scroll after growth. Yields to first-hole X/Y hops when those fields exist.

## Iteration

2026-09-13 08:15 BST — Tab from last outer path point X onto first hole header when wrap is off and last Y is missing; still yields to Y.

## Next recommended

Wire Shift+Tab from the first hole header onto the last outer path point X at document level when wrap is off and last Y is missing.
