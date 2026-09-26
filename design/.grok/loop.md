# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 12:20 BST — Inspector Layer section: opacity slider, full blend modes (including hard light, color dodge, color burn), hide/show and lock. Single-select Ink uses FillEditor + ShadowEditor. Typecheck fixes for AI text stroke fields and campaign format labels.

## Next recommended

Inspector type section for a single text layer: tracking, leading, and optical-size sliders always visible (not only when mixed). Export PNG with current blend mode baked.

## Done

- Inspector shows Layer appearance for any selection: opacity, blend select with all BlendMode values, Hide/Show, Lock/Unlock.
- Single-layer Ink panel wires FillEditor and ShadowEditor (previously only mixed multi-select had ink).
- AI text nodes include strokeDash, strokeDashOffset, lineCap, lineJoin, miterLimit so they typecheck as TextNode.
- Campaign strip shortFormat accepts a missing formatId.
