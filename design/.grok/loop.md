# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 13:20 BST — Single text Inspector Type section always shows tracking, leading, and optical-size sliders (optical uses a 6–144 fallback when the face has no opsz axis). Multi-select still uses MixedType. PNG export already bakes `n.blend` through `drawDocument`; SVG now writes `mix-blend-mode`. AI text nodes carry stroke dash/cap fields for typecheck.

## Next recommended

Export JPEG/print PNG should keep the same blend bake. Inspector type copy field for a single text layer could grow a live character count. Path/shape ink stroke dash on single-select.

## Done

- Single-select text uses TextFields (copy, tracking, leading, optical always on).
- Mixed axis sliders always expose Optical even when no selected face advertises opsz.
- SVG export emits mix-blend-mode for multiply through color-burn.
- PNG rasterize continues to draw via drawDocument so canvas blend is baked.
- AI normalizeNode includes strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit.
