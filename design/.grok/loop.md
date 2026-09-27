# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-27 17:05 BST — SVG wrap measure reuses one OffscreenCanvas (or tiny HTML canvas) for the whole export pass. applyFontFace runs only when wrapFaceCacheKey (family/weight/size/opsz + axes) changes, so long copy and many text layers no longer allocate a canvas per node.

## Next recommended

Images still use a rotate group — bake those boxes only if RIP work requires it. After fonts reload, call resetWrapMeasureCache so measureText does not keep a stale face.

## Done

- wrapMeasureForText caches wrapCtxCache; wrapFaceCacheKey gates applyFontFace.
- resetWrapMeasureCache clears the wrap canvas and last face key.
- wrapMeasureForText prefers OffscreenCanvas measureText after applyFontFace when document.fonts.status === "loaded".
- acquireWrapContext falls back to a tiny HTML canvas, then to optical-scaled glyph estimates.
- applyFontFace accepts Canvas and OffscreenCanvas 2d contexts.
- SVG wrap measure uses opticalWrapScale from the face opsz axis (1.08 caption → 0.96 display).
- Present chrome downloads baked-path SVG (E).
- SVG export bakes sharp rects as path outlines (no rotate group on geometry).
- Inspector mounts MixedPathDash for path, rect, ellipse, line, polygon, star, and arrow (single and mixed).
- MixedGeometry chips on multi-select for radius and rotation.
- applyStrokeStyle uses setLineDash(dash > 0 ? [dash, dash] : []), lineCap/lineJoin round fallback, miterLimit Math.max(1, … ?? 4).
- Path inspector defers dash UI to MixedPathDash (hideDash).
- CopyMeter under Inspector Type copy (characters / words / lines).
- MixedType shares CopyMeter across the selected stack.
- MixedType lists per-layer copy counts when texts differ.
- TypeAxes optical slider always on with 6–144 fallback.
- SVG export emits mix-blend-mode via blendAttr for non-normal layers.
- SVG export bakes convertible shapes as `<path d>` outlines, including sharp rects.
- PNG / JPEG / print PNG rasterize through drawDocument so canvas blend is baked.
- AI normalizeNode includes strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit.
- SVG text emits tspans per line with hanging baseline (no y + h * 0.8 hack).
- SVG path export uses pathFillRule and partitionPathHoles.
- SVG export rotates layers about the node center to match canvas.
- Compound path islands wrap in `<g data-islands="1">`.
- SVG text export wraps overflow with clipPath on the node box.
- Wrap width uses measureTracked so tracking matches canvas fillText and SVG letter-spacing.
- SVG path/shape export bakes rotation into anchors and cubic handles (no rotate group on flattened geometry).
