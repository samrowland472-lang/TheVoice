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
- Deepened path point tab-order navigation: focus-visible phosphor rings on fields and buttons; focusing a point header, X/Y field, or action (Smooth/Corner/Delete) selects the point on the canvas so keyboard travel stays in sync with the artboard.
- Restored full CanvasStage: live document drawing via drawDocument, knife tool with live cut-count status, hover snap phosphor crosses, and residual cut marks that linger ~1.6 s after a successful cut (soft outer glow + thin white cross that fades).
- Select, hand, and zoom on the canvas stage: click to select (shift for additive) with phosphor selection outlines; hand drag pans the viewport; wheel zooms toward the cursor.

- Marquee select on the canvas: drag a rectangle in the select tool to multi-select intersecting nodes (shift for additive). Live phosphor dashed rect + count status; click still selects single nodes.

## Iteration
2026-11-01T06:09:11Z — Added marquee select on the canvas stage. Drag a rectangle in the select tool to select intersecting nodes (shift additive). Phosphor dashed overlay + live count status. Click still selects. Typecheck, build, and browser-smoke green (hasCanvas true).

## Next recommended
- Polish knife residual fade curve / core brighten.
- Or deepen path point editing on the live canvas (drag points).
- Or move/resize handles on selected nodes.
