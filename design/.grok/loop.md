# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 15:20 BST — Inspector Photo section works on paint as well as photos. Brightness, contrast, saturate, blur, and crop sliders write onto a selected paint layer. Mixed selection unifies filters across bitmaps. Canvas and SVG honor crop + CSS filters via drawBitmapNode / clipPath. Alt+arrows still crop a selected bitmap; campaign page swap only when none is selected. Store history and node edits restored so those sliders can commit.

## Next recommended

Paint bitmap baking when the layer is resized. Campaign multi-page SVG that shares the same clip def set across boards. Path-edit undo that snapshots points, not only node boxes.

## Done

- Store-impl: history, node edits, campaign pages, placeNodes, crop-safe replaceNode, clipboard.
- Canvas select tool draws crop pins and drags applyCropHandle on image + paint.
- Alt+arrows crop selected bitmaps; otherwise campaign nudge.
- Inspector ImageAdjust + MixedFilters cover paint layers.
- render.drawBitmapNode + export svgBitmapMarkup bake crop and filters.
