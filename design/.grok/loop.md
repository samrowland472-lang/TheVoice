# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 16:02 BST — SVG layers emit mix-blend-mode (multiply through color-burn). JPEG, PNG, and print PNG all go through rasterize → drawDocument so canvas blend is baked. Mixed text selection shows the same CopyMeter totals as a single type field.

## Next recommended

SVG export still draws most shapes as rects; bake path/ellipse/star outlines. Mixed copy could list per-layer counts when texts differ.

## Done

- Inspector mounts MixedPathDash for path, rect, ellipse, line, polygon, star, and arrow (single and mixed).
- MixedGeometry chips on multi-select for radius and rotation.
- applyStrokeStyle uses setLineDash(dash > 0 ? [dash, dash] : []), lineCap/lineJoin round fallback, miterLimit Math.max(1, … ?? 4).
- Path inspector defers dash UI to MixedPathDash (hideDash).
- CopyMeter under Inspector Type copy (characters / words / lines).
- MixedType shares CopyMeter across the selected stack.
- TypeAxes optical slider always on with 6–144 fallback.
- SVG export emits mix-blend-mode via blendAttr for non-normal layers.
- PNG / JPEG / print PNG rasterize through drawDocument so canvas blend is baked.
- AI normalizeNode includes strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit.
