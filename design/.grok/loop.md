# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 03:15 UTC
- **Slice**: Copy / paste opacity (palette + Cmd+Shift+C/V)
- **Status**: Done

## Done
- Store keeps `opacityClip` separate from the node clipboard.
- `copyOpacity` / `pasteOpacity`: copy first selected layer’s opacity; paste applies to the whole selection with undo commit and status strip feedback (“Copied opacity 40%”, “Pasted opacity 40%”).
- Command palette Edit group: “Copy opacity” (Cmd+Shift+C) and “Paste opacity” (Cmd+Shift+V).
- Shortcuts: Cmd/Ctrl+Shift+C and Cmd/Ctrl+Shift+V call opacity copy/paste; plain Cmd+C/V still use the node clipboard.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Opacity histogram or mixed-value indicator when selection spans many tenths.
- Keyboard focus from the percent field back to the range with arrow keys.
- Paste opacity into the inspector percent field via a small chip when clip is set.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
