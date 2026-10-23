# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 20:26 UTC
- **Slice**: Tiny mixed legends for fill-rule and align
- **Status**: Done

## Done
- `fillRuleLegendEntries` + `MixedFillRuleLegend`: unique rules in order, human labels, count pills. Click unifies holed paths to that rule (ghosts on hover).
- Shown under the Rule select in Mixed Fill Rule when rules differ. Per-path chips kept.
- `alignLegendEntries` + `MixedAlignLegend`: unique aligns in order, labels, count pills. Click unifies text selection to that align.
- Shown under the Align buttons in Mixed Type when aligns differ.
- Typecheck clean. Build clean. Browser smoke clean (no console or page errors).

## Next recommended
- Optional fill on remaining positive ranges (axes, path dash, etc.).
- Keyboard coarse steps on the remaining non-fill ranges that already have Home/End.
- Tiny mixed legend for other multi-value enums if any remain (e.g. line join/cap).

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
