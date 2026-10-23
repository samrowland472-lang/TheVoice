# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 12:05 UTC
- **Slice**: Phosphor track fill on type size and crop ranges, Home/End jumps to min/max on fill ranges
- **Status**: Done

## Done
- Type size ranges (single and mixed) and photo crop edge ranges now draw a phosphor-to-ground track fill whose length and intensity follow the normalized value, using the same [data-fill-range] + --fill-percent path as photo filters and shadow blur.
- Home and End on those ranges (and the existing photo filter / shadow blur ranges) jump to min or max and commit immediately.
- Opacity tracks, mixed ticks, keyboard commit, and all other solid phosphor ranges unchanged.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Small opacity histogram legend when mixed.
- Optional fill for remaining positive ranges (type weight, leading, tracking) with the same percent variable.
- Keyboard PageUp/PageDown coarse steps on fill ranges.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
