# The Voice Design — loop

## Done
- Restored the Inspector rail (was a PLACEHOLDER that broke typecheck and the studio).
- Single-select: transform, appearance, type, path, image, group notes.
- Multi-select: shared opacity/blend, MixedType, MixedPathDash, MixedFilters, MixedGeometry, ShadowEditor.
- Align to key / Align to board edge chips with live preview chip and commit echo.
- Distribute H/V with gap readout.
- Print marks toggle, 3 mm / 6 mm / None bleed, +V / +H guides.
- Collapse inspector to rail (localStorage).
- Polished scatter angle readout: live BrushTipPreview in brush status shows phosphor cross + degree label when scatter brushes are tilted; status line echoes the scatter angle.
- Scatter strength slider in the paint dock: live override of preset scatter (0–3), applied to strokes, tip preview cross length, and stroke preview. Switching brushes resets to the preset value.

## Iteration
2026-10-31T21:05:00Z — Scatter strength slider shipped (dock live override). Typecheck, build, and browser-smoke green.

## Next recommended
- Deepen path point tab-order or knife cut feedback.
- Or polish scatter status echo to show the live strength number.
