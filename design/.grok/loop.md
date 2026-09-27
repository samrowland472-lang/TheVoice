# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-27 21:10 BST — Image crop is live on canvas and SVG. Crop windows are source-normalized; canvas `drawImage` samples the crop rect, SVG places a scaled `<image href>` and clips it to the node box. Brightness, contrast, saturate, and blur now apply as the same CSS `filter` on canvas and as an attribute on the SVG image. Photo inspector sliders write crop + filters; mixed multi-select still uses MixedFilters.

## Next recommended

Paint layers still skip crop/filters. Inspector crop is sliders only — add on-canvas crop handles. Export JPEG of cropped photos still rasterizes the full bitmap through drawDocument (correct) but SVG clipPaths are not reused across pages.

## Done

- normalizeCrop / cropSourceBox / cropSourceRect in image-filters.
- cssFilterStyle + svgImageFilterStyle share brightness/contrast/saturate/blur.
- render.ts applyCanvasFilters then draw cropped source.
- svgPlacedImage + bakedBoxTransform + svgImageCropClip.
- exportSvg emits image and paint as placed `<image href>`.
- watchFontsForWrapCache lives on export.ts (loadingdone + fonts.ready).
- ImageAdjust inspector: filter sliders, crop x/y/w/h, reset / full frame.
- MixedFilters mounted for multi photo selection.
- bakedBoxTransform writes matrix(a b c d e f) about the node center.
- svgPlacedImage emits href + preserveAspectRatio="none" + baked matrix.
- Image nodes include svgImageFilterStyle from normalizeFilters.
- Paint nodes use bitmap as href.
- watchFontsForWrapCache listens for loadingdone and fonts.ready, then resetWrapMeasureCache.
- StudioApp mounts the font watch once.
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
