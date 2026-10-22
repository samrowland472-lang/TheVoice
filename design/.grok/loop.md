# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 07:05 UTC
- **Slice**: Mixed opacity range in inspector + paste chip
- **Status**: Done

## Done
- Inspector Opacity field shows the min–max percent range when the selection is mixed (e.g. Opacity · 40–90%).
- When an opacity is on the clipboard, a phosphor Paste chip appears next to the 100% button and applies the clipped value to the current selection (same path as Cmd+Shift+V).
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Opacity histogram ticks under the range when mixed.
- Keyboard focus from the percent field back to the range with arrow keys.
- Live preview of the clipped opacity on the range thumb.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
