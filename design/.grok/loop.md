# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-21 14:03 BST
- **Slice**: Layers panel opacity quick-strip + per-row opacity badge
- **Status**: Done

## Done
- Added `OpacityQuickStrip` in the layers panel header. When one or more layers are selected it shows a phosphor range that writes opacity to the selection (mixed values labelled “Mixed”).
- Layer rows now show a small mono badge (`NN%`) when opacity is not 100%.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, no console errors).

## Next recommended
- Make the opacity badge clickable to focus the quick-strip, or add a keyboard shortcut (e.g. `0`–`9` for opacity steps) while a layer is selected.
- Surface the same control in the mobile sheet version of the layers panel if it exists.
- Consider a “copy opacity” / “paste opacity” pair in the command palette.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
