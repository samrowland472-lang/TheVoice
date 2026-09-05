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

1. Path inspector: scroll the highlighted hole row into view when picked from the board.

## Done

- Path inspector hole pick: clicking inside a hole on the artboard selects that hole (`hitPathNode` body test after anchors). The matching Holes · row lights phosphor; Even-odd / Nonzero still stamp `holeFillRules`. The picked ring draws a cool stroke on the board. `fillPathCompound` + SVG `fill-rule="nonzero"` islands stay in render/export.

- Path inspector per-hole fill-rule: compound paths list each hole with Even-odd (punch) vs Nonzero (island). `holeFillRules` persist with the node; canvas fill and SVG export partition cut rings into the outer evenodd path and draw island rings as separate nonzero fills. Deleting a hole drops its rule. Restored `esc()` entities in export.ts.

## Iteration

2026-09-06 00:10 BST — Pick a hole on the artboard; highlight its inspector row.

## Next recommended

Path inspector: scroll the highlighted hole row into view when picked from the board.
