# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 19:05 UTC
- **Slice**: PageUp/PageDown coarse steps on phosphor fill ranges
- **Status**: Done

## Done
- Shared `nextFromRangeKey` helper: Home → min, End → max, PageUp/PageDown → ~10% of the range snapped to step.
- Applied to type size/weight/tracking/leading (single and mixed), photo filters, crop edges, shadow blur, mixed photo filters, and layer opacity.
- Typecheck clean. Build clean. Browser smoke clean (no console or page errors, no brand warnings).

## Next recommended
- Tiny mixed-blend legend when blend modes differ.
- Optional fill on remaining positive ranges (axes, path dash, etc.).
- Keyboard coarse steps on the remaining non-fill ranges that already have Home/End.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
