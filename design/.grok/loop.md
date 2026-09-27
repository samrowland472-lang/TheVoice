# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-27 22:15 BST — On-canvas crop handles for a single selected photo. Select tool draws the full-source ghost and eight phosphor handles on the crop window. Dragging an edge/corner resizes the node inside a frozen source box and rewrites source-normalized `crop`. Inspector sliders remain; Photo panel now points at the board handles. Also shipped `watchFontsForWrapCache` on export.ts so typecheck matches the re-export.

## Next recommended

Paint layers still skip crop/filters. Multi-photo crop handles. Keyboard nudge of crop edges. SVG clipPaths reused across pages.

## Done

- crop-handles: cropFromBoxes, clampNodeToSource, applyCropHandle, drawCropHandles, hitCropHandle.
- CanvasStage cropRef drag on select + image.
- ImageAdjust hint for board crop handles.
- watchFontsForWrapCache exported from export.ts.
- normalizeCrop / cropSourceBox / cropSourceRect in image-filters.
