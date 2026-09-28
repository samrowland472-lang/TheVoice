# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 18:20 BST — Paint layers resample their bitmap when the box changes. Inspector and magic-resize write width/height through bakePaintIfSized / bakePaintNode so strokes stay locked to the layer; an active crop flattens into the new pixels. Canvas drawBitmapNode honors crop + CSS filters on paint and photos. Store history, node edits, campaign pages, and clipboard actions restored so those writes can commit.

## Next recommended

Campaign multi-page SVG that shares the same clip def set across boards. Path-edit undo that snapshots points, not only node boxes. Live canvas resize handles that call mapNodes so paint bake runs mid-drag.

## Done

- paint-bake.ts: paintBakeSize, paintNeedsBake, bakePaintNode, bakePaintIfSized.
- store-impl updateNodes / mapNodes / replaceNode / resizeArtboard bake paint on size change.
- Store history, campaign pages, placeNodes, clipboard, print bleed restored.
- render.drawBitmapNode uses cropSourceRect + cssFilterStyle.
