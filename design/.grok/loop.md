# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 21:20 BST — SVG export wraps rotated nodes in `rotate(deg cx cy)` about the box center (text, paths, outlines, rects). Compound path islands live in a sibling `<g data-islands>`.

## Next recommended

SVG clip to text box. Letter-spacing on wrap measure vs canvas. Bake rotated cubic handles into path d when groups are flattened.

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
- SVG text emits tspans per line with hanging baseline (no y + h * 0.8 hack).
- SVG path export uses pathFillRule and partitionPathHoles.
- SVG export rotates layers about the node center to match canvas.
- Compound path islands wrap in `<g data-islands="1">`.
