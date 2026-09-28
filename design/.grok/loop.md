# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 03:02 BST — Paint layers now carry crop + filters like photos. Canvas select draws phosphor crop pins on every selected photo or paint layer; drag a pin writes a source-normalized crop. Alt+arrows nudge the facing edge. Inspector sliders work on paint. SVG export clips the bitmap and applies the same CSS filter string. Store gained commit / placeNodes / replaceNode / translateSelected so the drag actually sticks.

## Next recommended

SVG clipPaths reused across pages. Paint bitmap baking when the layer is resized. Multi-page campaign crop presets.

## Done

- PaintNode crop + filters; isBitmap helper.
- drawBitmapNode uses cropSourceRect + cssFilterStyle.
- exportSvg image/paint via clipped image tag.
- Canvas cropRef + multi-selection crop handles.
- Alt+arrows crop selected bitmaps.
- ImageAdjust + MixedFilters include paint.
- store-impl: commit, undo/redo, replaceNode, updateNodes, placeNodes, translateSelected.
