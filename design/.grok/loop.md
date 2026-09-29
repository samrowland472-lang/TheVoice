# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 05:10 BST — Path-edit mid-drag applies from a frozen pointer-down snapshot. Undo restores the pre-drag points; handles do not accumulate from the live node. export.ts entity escaping compiles again.

## Next recommended

Present peek chrome tests still expect older hairline class names. Isolate Show-all still restores from snapshot.

## Done

- canvas-stage stores orig: snapshotPathNode on path drag / pen pull.
- editPathHit(..., base?: PathNode) applies against the snapshot mid-drag.
- export.ts esc() writes real XML entities.
- store-impl.placeNodes typed as { id, x, y }[].
- export pipeline (prior): rasterize, SVG defs, print JPEG PDF.
