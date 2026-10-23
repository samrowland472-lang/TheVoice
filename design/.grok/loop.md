# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 22:05 UTC
- **Slice**: Polish mixed cap/join legends with visual icons and count badges
- **Status**: Done

## Done
- MixedCapLegend and MixedJoinLegend now include tiny inline SVG icons showing the actual line-cap and line-join style (butt/round/square, miter/round/bevel).
- Count pills restyled as subtle phosphor badges. Buttons slightly larger with hover feedback.
- Ghost preview on hover/focus still unifies the outline style for inspection.
- Typecheck clean. Build clean. Browser smoke clean (no console or page errors).

## Next recommended
- Optional fill on remaining positive ranges (axes, path dash, etc.).
- Keyboard coarse steps on the remaining non-fill ranges that already have Home/End.
- Tiny mixed legend for other multi-value enums if any remain.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
