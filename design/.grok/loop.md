# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 14:05 UTC
- **Slice**: Click a mixed-opacity histogram tick to set the selection
- **Status**: Done

## Done
- When the selection has mixed opacity, the phosphor histogram ticks under the range are now clickable. Clicking a tick sets every selected layer to that opacity and commits.
- Ticks use a wider hit target, cursor pointer, hover brighten, and focus ring. Title and aria-label explain the action.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Keyboard focus from the percent field back to the range with arrow keys.
- Live preview of the clipped opacity on the range thumb.
- Show the count in the tick tooltip more prominently, or a small number badge on tall ticks.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
