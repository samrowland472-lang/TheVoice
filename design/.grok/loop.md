# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-21 18:03 BST
- **Slice**: Opacity badge focus + Alt+0–9 tenths shortcut
- **Status**: Done

## Done
- Opacity badges in layer rows are now buttons. Click selects the layer (if needed) and focuses the OpacityQuickStrip range.
- Alt+0–9 while a layer is selected sets opacity to 0%–90% in tenths and commits (does not conflict with existing zoom keys).
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, no console errors).

## Next recommended
- Surface a matching opacity control in the inspector rail for the same selection so the badge and range stay in sync.
- Add Alt+Shift+0 for 100% or a small “100%” chip next to the strip.
- Consider copy/paste opacity in the command palette.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
