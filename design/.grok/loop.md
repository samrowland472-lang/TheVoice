# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 11:04 UTC
- **Slice**: Opacity histogram ticks under the range when mixed
- **Status**: Done

## Done
- When the selection has mixed opacity, phosphor histogram ticks appear under the opacity range. Each unique percent gets a vertical tick whose height scales with how many layers share that opacity.
- Ticks sit just below the track, pointer-events none, and the range wrapper gains a small bottom margin so they do not collide with the next field.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Keyboard focus from the percent field back to the range with arrow keys.
- Live preview of the clipped opacity on the range thumb.
- Click a histogram tick to set the selection to that opacity.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
