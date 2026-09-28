# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 10:01 BST — On-canvas phosphor crop pins for photos and paint. Select a bitmap and drag the cyan corner/edge pins to crop against a frozen source box. Inspector crop sliders cover paint as well as photos. Alt+arrows nudge the facing crop edge. Store commit / replaceNode / placeNodes / updateNodes / translateSelected so inspector and drag stick.

## Next recommended

Paint bitmap baking when the layer is resized. Campaign multi-page SVG that shares the same clip def set across boards.

## Done

- PaintNode crop + filters; isBitmap helper.
- drawNode clips bitmaps via cropSourceBox + cssFilterStyle.
- exportSvg image/paint via clipped `<image>` and shared clipPath defs.
- ImageAdjust + MixedFilters include paint.
- Alt+arrows crop selected bitmaps.
- store-impl: commit, undo/redo, replaceNode, updateNodes, placeNodes, translateSelected, setArtboardBg, closeSelectedPath.
- Canvas select tool draws and drags phosphor crop pins on image and paint layers.
