# The Voice Design — loop

## Done
- Rotation handle on selected layers with live smart guides: phosphor circle orbits above the local top-center; drag to rotate around the layer center (Shift free, otherwise soft-snaps to 15°). Live dashed phosphor ray from center, brighter + cross when snapped to cardinals. Status echoes angle. Works on groups and leaves. Typecheck, build, browser-smoke green (hasCanvas true).
- Resize handles on selected layers with live smart guides: phosphor squares on selection; drag corners/edges to resize (Shift locks aspect); edges snap to artboard and sibling edges/centers with phosphor dashed guides; groups scale descendants; leaf paths and shapes map correctly. Status echoes size and snap.
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
- Marquee select on the canvas: drag empty board to draw a phosphor marquee; intersects layers by default; Alt switches to contain mode with corner ticks; Shift/meta adds to selection; live count in status strip; click without drag still clears.

## Iteration
2026-11-01T09:09:18Z — Rotation handle on selected layers with live smart guides. Phosphor circle above selection orbits with rotation; drag sets angle around center with 15° soft snap (Shift free). Live dashed ray + cardinal cross when snapped. Status shows degrees. Typecheck, build, browser-smoke green (hasCanvas true).

## Next recommended
- Polish knife residual fade curve / core brighten.
- Or deepen path point editing on the live canvas.
- Or multi-select rotation around collective center with smart angle guides.
