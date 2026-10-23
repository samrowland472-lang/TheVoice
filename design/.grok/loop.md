# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 18:05 UTC
- **Slice**: Phosphor fill on type weight, tracking, and leading ranges
- **Status**: Done

## Done
- Type weight (400–800), tracking (−8–40), and leading (0.7–2) ranges now show live phosphor track fill via the same `--fill-percent` variable used on size, blur, and filters.
- Home jumps to the range minimum and End to the maximum on those three ranges (single and mixed selection).
- Mixed selection still drives the fill from the key node value.
- Typecheck clean. Build clean. Browser smoke clean.

## Next recommended
- Keyboard PageUp/PageDown coarse steps on fill ranges.
- Tiny mixed-blend legend when blend modes differ.
- Optional fill on remaining positive ranges (axes, path dash, etc.).

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
