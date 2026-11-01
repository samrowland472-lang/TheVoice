# The Voice Design — loop

## Done
- Knife cut feedback: live status echo while dragging shows cut count and path count (e.g. “Knife · 3 cuts across 1 path”); on release holds “Path cut” or “Knife · no cut”.
- Restored the Inspector rail (was a PLACEHOLDER that broke typecheck and the studio).
- Single-select: transform, appearance, type, path, image, group notes.
- Multi-select: shared opacity/blend, MixedType, MixedPathDash, MixedFilters, MixedGeometry, ShadowEditor.
- Align to key / Align to board edge chips with live preview chip and commit echo.
- Distribute H/V with gap readout.
- Print marks toggle, 3 mm / 6 mm / None bleed, +V / +H guides.
- Collapse inspector to rail (localStorage).
- Polished scatter angle readout: live BrushTipPreview in brush status shows phosphor cross + degree label when scatter brushes are tilted; status line echoes the scatter angle.
- Scatter strength slider in the paint dock: live override of preset scatter (0–3), applied to strokes, tip preview cross length, and stroke preview. Switching brushes resets to the preset value.
- Scatter status echo now shows the live strength number (e.g. “scatter 1.2”) beside the tilt angle while painting; strength is omitted when the override is off.
- Scatter tip preview now draws the live strength number (phosphor, upright) on the short axis of the cross when the pen is tilted.
- Brush tip preview shows a faint isotropic strength tick + number even at rest / low tilt, so the scatter override is readable before the pen leans.
- Stronger knife cut-point phosphor: soft outer glow, bright core, thin white cross on both stroke-drag marks and hover snap points so cut locations read clearly on the canvas.

## Iteration
2026-11-01T02:08:00Z — Stronger knife cut-point phosphor (glow + core + cross) for drag marks and hover snap. Typecheck, build, and browser-smoke green.

## Next recommended
- Deepen path point tab-order navigation.
- Or polish the scatter tip further (e.g. live strength tick length while dragging the slider).
- Or knife cut residual marks that linger briefly after a successful cut.
