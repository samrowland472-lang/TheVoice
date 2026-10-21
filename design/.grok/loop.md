# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-21 21:01 BST
- **Slice**: Inspector opacity rail matches layers badge + Alt+Shift+0 full
- **Status**: Done

## Done
- Opacity range in the inspector rail now carries data-opacity-range="inspector". Layer-row badges prefer focusing that range so the rail and the strip stay in step.
- Matching 100% chip next to both the inspector range and the layers OpacityQuickStrip. Click sets selection opacity to 1 and commits.
- Alt+Shift+0 sets selection opacity to 100% (Alt+0–9 still sets tenths). Tooltips mention the full shortcut.
- Typecheck clean. Build clean. Browser smoke clean.

## Next recommended
- Copy/paste opacity via the command palette (or Ctrl/Cmd+Shift+C / V for opacity only).
- Live numeric readout next to the range that accepts direct percent entry.
- Opacity histogram or mixed-value indicator when selection spans many tenths.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
