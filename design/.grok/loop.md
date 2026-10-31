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

## Iteration
2026-10-31T20:15:00Z — Scatter angle readout polished (tip preview + status). Typecheck, build, and browser-smoke green.

## Next recommended
- Deepen path point tab-order or knife cut feedback.
- Or add a scatter strength slider in the paint dock for live override.
