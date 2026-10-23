# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 15:05 UTC
- **Slice**: Small opacity histogram legend when mixed
- **Status**: Done

## Done
- When layer opacity is mixed, a compact phosphor legend appears under the opacity controls listing each distinct percent and its layer count (sorted, e.g. 2×50% · 1×80%).
- Existing mixed ticks under the range remain clickable to unify values.
- Opacity track fill, Home/End, percent field, and all other ranges unchanged.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Optional fill for remaining positive ranges (type weight, leading, tracking) with the same percent variable.
- Keyboard PageUp/PageDown coarse steps on fill ranges.
- Tiny mixed-blend legend when blend modes differ.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
