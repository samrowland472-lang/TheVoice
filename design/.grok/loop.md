# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 20:16 UTC
- **Slice**: Tiny mixed-blend legend when blend modes differ
- **Status**: Done

## Done
- `blendLegendEntries` + `MixedBlendLegend`: unique modes in phosphor order, human labels, count pills. Click unifies the selection to that mode.
- Shown under the Blend select in the inspector and above the per-layer chips in Mixed Ink when modes differ. Per-layer chips kept.
- Typecheck clean. Build clean. Browser smoke clean (no console or page errors, no brand warnings).

## Next recommended
- Optional fill on remaining positive ranges (axes, path dash, etc.).
- Keyboard coarse steps on the remaining non-fill ranges that already have Home/End.
- Tiny mixed legend for other multi-value enums (align, fill-rule) in the same style.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
