# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-27 22:25 BST — Select tool crop handles are live: source ghost, eight phosphor pins, drag resizes the frame against a frozen source box and writes source-normalized crop. placeNodes + commit stamp the node. Photo inspector already points at the board. watchFontsForWrapCache lives on export.ts.

## Next recommended

Paint layers still skip crop/filters. Multi-photo crop handles. Keyboard nudge of crop edges. SVG clipPaths reused across pages.

## Done

- crop-handles: cropFromBoxes, clampNodeToSource, applyCropHandle, drawCropHandles, hitCropHandle.
- CanvasStage cropRef drag on select + image.
- ImageAdjust hint for board crop handles.
- watchFontsForWrapCache exported from export.ts.
- normalizeCrop / cropSourceBox / cropSourceRect in image-filters.
