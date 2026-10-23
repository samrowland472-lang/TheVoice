# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 21:15 UTC
- **Slice**: Tiny mixed legends for line cap and join
- **Status**: Done

## Done
- `capLegendEntries` + `MixedCapLegend`: unique caps in order, human labels, count pills. Click unifies outlines to that cap (ghosts on hover).
- Shown under the Cap select in Mixed Path Dash when caps differ. Per-path chips kept.
- `joinLegendEntries` + `MixedJoinLegend`: unique joins in order, labels, count pills. Click unifies outlines to that join (ghosts on hover).
- Shown under the Join select in Mixed Path Dash when joins differ. Per-path chips kept.
- Typecheck clean. Build clean. Browser smoke clean (no console or page errors).

## Next recommended
- Optional fill on remaining positive ranges (axes, path dash, etc.).
- Keyboard coarse steps on the remaining non-fill ranges that already have Home/End.
- Tiny mixed legend for other multi-value enums if any remain.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
