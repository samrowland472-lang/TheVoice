# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 19:05 BST — Live canvas resize handles. Select a layer (or a group) and drag the eight phosphor squares on the selection box. Shift locks aspect. Each drag writes through mapNodes so paint layers resample their bitmap as the box changes.

## Next recommended

Campaign multi-page SVG that shares the same clip def set across boards. Path-edit undo that snapshots points, not only node boxes.

## Done

- box-resize.ts: hitResizeHandle, resizeBox, mapNodeToBox.
- canvas-stage: select-tool handles, mid-drag mapNodes from pointer-down snapshot.
- paint-bake.ts: paintBakeSize, paintNeedsBake, bakePaintNode, bakePaintIfSized.
- store-impl updateNodes / mapNodes / replaceNode / resizeArtboard bake paint on size change.
- Store history, campaign pages, placeNodes, clipboard, print bleed restored.
- render.drawBitmapNode uses cropSourceRect + cssFilterStyle.
