# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-27 03:15 BST — Flatten and SVG path export bake rotation into cubic handles: `bakeRingRotation` rotates anchors about the box center and handle offsets about the origin, then `pathDBaked` writes world-space `C` commands. Text clipPath stays inside `rotateWrap` so clip and type share the same rotate space.

## Next recommended

Optical-size wrap vs canvas (measure with opsz applied, not just font-size). Bake sharp-rect rotation into transform-free markup if flatten should drop `<g rotate>` entirely.

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
- SVG text export wraps overflow with clipPath on the node box.
- Wrap width uses measureTracked so tracking matches canvas fillText and SVG letter-spacing.
- bakeRingRotation / rotateOffset live in geometry; bakePathRotation and SVG pathDBaked share them.
- Rotated path and convertible-shape SVG outlines emit baked cubics (no double rotate group).
- SVG text clipPath remains a child of the rotate group.
