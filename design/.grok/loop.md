# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 04:05 BST
- **Slice**: Copy/paste opacity via command palette and Cmd/Ctrl+Shift+C / V
- **Status**: Done

## Done
- Copy opacity of the first selected layer (notes mixed) with Cmd/Ctrl+Shift+C or the “Copy opacity” command. Status strip confirms the percent.
- Paste that opacity onto the current selection with Cmd/Ctrl+Shift+V or “Paste opacity”. Applies to every selected layer and is undoable.
- Command palette lists both actions under Edit with the keyboard hints.
- Typecheck clean. Build clean. Browser smoke clean (canvas present, no console errors).

## Next recommended
- Opacity histogram or mixed-value indicator when selection spans many tenths.
- Keyboard focus from the percent field back to the range with arrow keys.
- Copy/paste other numeric properties (stroke width, blur) the same way.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
