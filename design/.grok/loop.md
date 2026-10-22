# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 22:08 UTC
- **Slice**: Home/End from opacity percent field + count badges on mixed ticks
- **Status**: Done

## Done
- From the Layer opacity percent field, Home jumps the selection to 0% and End jumps to 100%, commits, and moves focus onto the phosphor range.
- Mixed-opacity ticks now show a small phosphor count badge above the tick when more than one layer shares that value, making the histogram readable at a glance.
- Arrow keys, left/right at the caret ends, and the range itself continue to step and commit as before.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Live preview of the clipped opacity on the range thumb (phosphor swatch or thumb fill that tracks the current value).
- Keyboard Home/End also on the range itself (already partially handled via onKeyUp commit).
- Small opacity histogram legend when mixed.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
