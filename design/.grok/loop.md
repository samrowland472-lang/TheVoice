# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 15:08 BST — Path and shape ink now expose dash, offset, cap, join, and miter on single-select as well as mixed picks. Canvas stroke defaults match the inspector (round cap/join, miter ≥ 1). Mixed geometry chips unify radius across a multi-pick.

## Next recommended

Export JPEG/print PNG should keep the same blend bake. Mixed-select copy field could share the same meter.

## Done

- Inspector mounts MixedPathDash for path, rect, ellipse, line, polygon, star, and arrow (single and mixed).
- MixedGeometry chips on multi-select for radius and rotation.
- applyStrokeStyle uses setLineDash(dash > 0 ? [dash, dash] : []), lineCap/lineJoin round fallback, miterLimit Math.max(1, … ?? 4).
- Path inspector defers dash UI to MixedPathDash (hideDash).
- CopyMeter under Inspector Type copy (characters / words / lines).
- TypeAxes optical slider always on with 6–144 fallback.
- SVG export emits mix-blend-mode for multiply through color-burn.
- PNG rasterize continues to draw via drawDocument so canvas blend is baked.
- AI normalizeNode includes strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit.
