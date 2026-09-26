# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 14:10 BST — Single-select Type copy field now shows a live character, word, and line count. Optical-size slider always appears for a single text layer, using a 6–144 fallback when the face has no opsz axis. Copy commits on blur.

## Next recommended

Path/shape ink stroke dash on single-select. Export JPEG/print PNG should keep the same blend bake. Mixed-select copy field could share the same meter.

## Done

- CopyMeter under Inspector Type copy (characters / words / lines).
- TypeAxes optical slider always on with 6–144 fallback.
- Single-select text uses TextFields (copy, tracking, leading, optical always on).
- Mixed axis sliders always expose Optical even when no selected face advertises opsz.
- SVG export emits mix-blend-mode for multiply through color-burn.
- PNG rasterize continues to draw via drawDocument so canvas blend is baked.
- AI normalizeNode includes strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit.
