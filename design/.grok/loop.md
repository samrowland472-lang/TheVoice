# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 01:10 BST — Select/image tools draw phosphor crop pins on a selected photo. Drag a pin resizes the frame against a frozen source box and writes source-normalized crop. Alt+arrows nudge the facing edge. Store now has commit / placeNodes / translateSelected so the drag and keys actually stick.

## Next recommended

Paint layers still skip crop/filters. Multi-photo crop handles. SVG clipPaths reused across pages.

## Done

- crop-handles: nudgeCropHandle, cropHandleForArrow.
- CanvasStage cropRef drag + drawCropHandles on select/image.
- Shortcuts: Alt+arrows crop an edge instead of moving the node.
- store-impl: commit, placeNodes, translateSelected, undo/redo.
- watchFontsForWrapCache on export.ts.
- ImageAdjust hint for board crop + Alt+arrows.
