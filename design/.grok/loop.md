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

1. Path inspector: Tab from an x field should land on that point's y, then the next point's x.

## Done

- Path inspector Enter-commit keeps focus: NumField Enter commits x/y without blur so Tab can walk the next field. Escape still cancels and blurs. Point rows still scroll on focus/commit.

- Path inspector point-field scroll: focusing or committing an x/y NumField selects that point and scrolls its Points row into view (`revealAndSelect` + `onFocus` on NumField). Clicking the row header does the same. ← / → ring walk still uses `[data-point]` scrollIntoView.

- Path inspector hole-point scroll: walking a picked ring with ← / → (or tapping a point) scrolls the matching Points row into view (`scrollIntoView` on `[data-point]`). Holes · header still shows `pt n/m`. Outer path points use `path-n`; hole points use `hole-h-n`.

- Path inspector hole-point header: with a hole picked, the Holes · label shows `pt n/m` for the active ring point. Key hints list ↑↓ ←→ Home End ⇧Home ⇧End. Restored `←→` in the unpicked-hole header.

- Path inspector Shift+Home / Shift+End: with a hole picked, jump to the first or last *point* on that ring (`jumpPathHolePoint`). Home / End without Shift still jump holes. Header lists ⇧Home ⇧End. Restored `esc()` HTML entities in export.ts.

- Path inspector hole-point walk: with a hole picked, ← / → cycle points on that ring (`stepPathHolePoint`) instead of nudging the node. The matching Points row (`data-point`) scrolls into view. Header lists ↑↓ ←→ Home End. Restored `esc()` HTML entities in export.ts.

- Path inspector Home / End: with a hole picked, Home jumps to the first hole and End jumps to the last (`jumpPathHole`). ↑ / ↓ still walk one hole at a time. The Holes · header lists the keys. Highlighted row still scrolls into view.

- Path inspector hole walk: with a hole picked, ↑ / ↓ select the previous / next hole (`stepPathHole`) instead of nudging the node. The highlighted Holes · row still scrolls into view. Canvas `fillPathCompound` partitions even-odd punches vs nonzero islands again.

- Path inspector delete-hole: highlighted Holes · row has a Delete hole control. `deletePathHole` drops the ring and its `holeFillRules` entry via `dropHole`. Remaining holes stay selected (or the pick clears when none remain). Even-odd / Nonzero still stamp per-hole rules.

- Path inspector hole scroll: picking a hole on the artboard (or tapping its row) scrolls that Holes · row into view (`scrollIntoView({ block: "nearest" })` on `[data-hole]`). Per-hole Even-odd / Nonzero rows remain in the inspector.

- Path inspector hole pick: clicking inside a hole on the artboard selects that hole (`hitPathNode` body test after anchors). The matching Holes · row lights phosphor; Even-odd / Nonzero still stamp `holeFillRules`. The picked ring draws a cool stroke on the board. `fillPathCompound` + SVG `fill-rule="nonzero"` islands stay in render/export.

- Path inspector per-hole fill-rule: compound paths list each hole with Even-odd (punch) vs Nonzero (island). `holeFillRules` persist with the node; canvas fill and SVG export partition cut rings into the outer evenodd path and draw island rings as separate nonzero fills. Deleting a hole drops its rule. Restored `esc()` entities in export.ts.

## Iteration

2026-09-06 13:22 BST — Enter on path x/y commits and keeps the caret for Tab.

## Next recommended

Path inspector: Tab from an x field should land on that point's y, then the next point's x.
