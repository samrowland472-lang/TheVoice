# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 01:05 BST
- **Slice**: Live percent entry next to opacity range
- **Status**: Done

## Done
- Inspector opacity rail now has a live numeric percent field (NumField) beside the range. Type a number 0–100, Enter or blur to commit. Range still updates the readout live. 100% chip and Alt+Shift+0 unchanged.
- Layers OpacityQuickStrip matches: same percent field, mixed state shows “—” until you type, and committing sets every selected layer.
- Mixed label stays “Opacity · mixed” in the inspector; the field placeholder is “—” while values differ.
- Typecheck clean. Build clean. Browser smoke clean.

## Next recommended
- Copy/paste opacity via the command palette (or Ctrl/Cmd+Shift+C / V for opacity only).
- Opacity histogram or mixed-value indicator when selection spans many tenths.
- Keyboard focus from the percent field back to the range with arrow keys.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
