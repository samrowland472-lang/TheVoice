# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 19:05 BST — SVG export draws ellipse, star, polygon, arrow, line, and rounded-rect as path outlines via shapeContour + pathD. Sharp rects stay `<rect>`. Mixed type shows CopyMeter on joined copy and per-layer character/word counts when the texts differ.

## Next recommended

SVG text still sits on a baseline hack; emit tspans per line. Path holes and fill-rule are unused in export.ts. Align outline paths with rotation.

## Done

- Inspector mounts MixedPathDash for path, rect, ellipse, line, polygon, star, and arrow (single and mixed).
- MixedGeometry chips on multi-select for radius and rotation.
- applyStrokeStyle uses setLineDash(dash > 0 ? [dash, dash] : []), lineCap/lineJoin round fallback, miterLimit Math.max(1, … ?? 4).
- Path inspector defers dash UI to MixedPathDash (hideDash).
- CopyMeter under Inspector Type copy (characters / words / lines).
- MixedType shares CopyMeter across the selected stack.
- MixedType lists per-layer copy counts when texts differ.
- TypeAxes optical slider always on with 6–144 fallback.
- SVG export emits mix-blend-mode via blendAttr for non-normal layers.
- SVG export bakes convertible shapes as `<path d>` outlines (except sharp rects).
- PNG / JPEG / print PNG rasterize through drawDocument so canvas blend is baked.
- AI normalizeNode includes strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit.
