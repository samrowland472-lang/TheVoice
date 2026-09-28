# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 22:25 BST — Path-edit undo snapshots points. Dragging an anchor or handle freezes the path at pointer-down; every move remaps from that snapshot so Undo restores the contour, not a box-only ghost. Select-tool resize handles scale path points with the frame.

## Next recommended

Campaign PDF that reuses the stacked board walk from Campaign SVG. Knife undo that snapshots both cut rings.

## Done

- path-edit.ts: clonePathPoint, snapshotPathNode.
- path-actions.editPathHit accepts a base snapshot.
- canvas-stage path drag stores `orig` and applies from it; select-tool resize uses hitResizeHandle + mapNodes from pointer-down nodes.
- box-resize.mapNodeToBox scales path points and hole rings.
- export.ts: collectSvgDefs + exportSvgBody; single-board SVG writes shared defs.
- store-impl.placeNodes typed.
