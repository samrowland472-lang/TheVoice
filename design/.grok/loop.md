# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 04:01 BST — Paint layers share crop + filters with photos. Inspector sliders and mixed filters hit paint. Canvas render clips the bitmap to the crop window and applies the CSS filter string. SVG export collects identical box clipPaths into one `<defs>` block and reuses them for text and bitmaps. Store gained commit / updateNodes / placeNodes / replaceNode / translateSelected so inspector and drag stick. Alt+arrows nudge the facing crop edge on selected bitmaps.

## Next recommended

Paint bitmap baking when the layer is resized. Campaign multi-page SVG that shares the same clip def set across boards. On-canvas phosphor crop pins for paint.

## Done

- PaintNode crop + filters; isBitmap helper.
- drawNode clips bitmaps via cropSourceBox + cssFilterStyle.
- exportSvg image/paint via clipped `<image>` and shared clipPath defs.
- ImageAdjust + MixedFilters include paint.
- Alt+arrows crop selected bitmaps.
- store-impl: commit, undo/redo, replaceNode, updateNodes, placeNodes, translateSelected, setArtboardBg, closeSelectedPath.
