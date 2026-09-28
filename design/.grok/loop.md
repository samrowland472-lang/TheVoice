# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 23:10 BST — Knife undo snapshots both rings. Cut planning clones outer and hole contours before any split; extras get their own point copies. Stroke cuts commit once, then replace from that snapshot so Undo restores the intact compound path instead of a half-cut ghost.

## Next recommended

Campaign PDF that reuses the stacked board walk from Campaign SVG. Path-edit mid-drag still uses the pointer-down snapshot — keep that contract if knife ever live-previews a cut.

## Done

- knife-apply: snapshotPathNode at the start of applyCutsToPath, applyKnifeStrokeToPath, applyKnifePointToPath.
- clonePathStyle clones rings so extras cannot alias live holes.
- path-actions.knifeCutStroke plans all hits, commits once, then writes keep + extras.
- export.ts: collectSvgDefs + exportSvgBody; single-board SVG writes shared defs.
- store-impl.placeNodes typed.
- path-edit.ts: clonePathPoint, snapshotPathNode.
