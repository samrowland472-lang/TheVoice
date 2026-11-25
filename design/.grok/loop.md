# The Voice Design · Improvement Loop

## Done
- 2026-11-25T04:12Z — On-canvas linear gradient angle handle for mixed selections: when multiple nodes share a uniform linear fill, phosphor dashed line + end handle now appear on every selected node. Dragging any handle scrubs the shared angle live across the whole selection (Shift snaps to 15°). Live Angle ° chips appear on all selected nodes during the drag. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T03:07Z — On-canvas radial gradient handles for mixed selections: when multiple nodes share a uniform radial fill, phosphor centre cross, focal diamond, and r0 handle now appear on every selected node. Dragging any handle (centre, focal, or inner radius) scrubs the shared fill parameters live across the whole selection (Shift snaps). Live % chips appear on all selected nodes during the drag. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T02:08Z — Live % chips on on-canvas radial centre and focal handles: dragging the phosphor centre cross or focal diamond now shows a phosphor value chip on the node (Centre XX%, YY% or Focal XX%, YY%). Scrub state tracks the drag; chips clear on commit. Matches the existing Inner radius chip pattern. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T01:22Z — Mixed gradient stop bar polish: larger phosphor stop markers (h-8 bar, size-3 handles) matching single FillEditor; optional commit flag. Restored after push glitch. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T01:06Z — Gradient stop drag on the mixed preview bar: when a mixed selection shares a uniform gradient fill, the Ink preview bar now shows phosphor stop markers. Drag a marker to scrub its offset live across every selected node (0–100%). Hover or drag shows a phosphor % chip. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T00:05Z — On-canvas radial r0 handle polish: handle direction is now rotation-aware (along rotated local +x from the focal). Live Inner % chip appears on the node while dragging the r0 handle (phosphor value chip). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T22:06Z — Gradient stop editing in mixed selection: when multiple nodes share a uniform gradient fill, the mixed Ink panel shows per-stop HexColorField, offset % NumField, Remove, and Add stop. Changes write to every selected node. Typecheck, build, smoke clean (hub content visible).
- On-canvas handle for radial inner radius: selecting a shape with a radial gradient shows a phosphor dashed circle at the focal (when r0 > 0) and a draggable handle to the right of the focal. Drag the handle to scrub the inner radius live (0–95% of outer, Shift snaps to 5%). Hit-testing prefers the r0 handle; status updates while dragging and on commit. Typecheck, build, smoke clean (hub content visible).
- Inner radius (r0) control for radial gradients: radial fills now support a movable inner radius (r0, 0–95% of outer radius, default 0). Canvas createRadialGradient uses the focal as the inner circle with radius r0 × outer. Inspector gains Inner radius % slider + NumField (single selection); mixed selection gains R0 NumField. CSS preview bars remap stops so the solid core is visible. Preserved in clone and fill keys; chip labels note rNN when set. Typecheck, build, smoke clean (hub content visible).
- Focal point (inner radius offset) for radial gradients: radial fills now use a separate focal point (fx/fy, defaulting to centre). Canvas renders the start circle at the focal with r=0 and the outer at the centre covering bounds. Inspector gains Focal X/Y % sliders + NumFields (single and mixed selection). On-canvas phosphor diamond handle (drag to reposition, Shift snaps to 5%, accounts for rotation); centre cross remains. Preserved in clone and fill keys. Typecheck, build, smoke clean (hub content visible).
- Mixed selection support for gradient fills: when multiple nodes are selected, the Ink Fill field shows a live gradient preview bar if the key fill is a gradient, labels it with the chip description, offers Apply key fill / Make all solid, and (when the selection is uniform) Linear/Radial toggle plus angle or CX/CY controls that write to every selected node.
- Radial centre offset: radial gradients now support a movable centre (cx/cy 0–1). On-canvas phosphor cross handle (drag to reposition, Shift snaps to 5%, accounts for rotation). Inspector gains Centre X/Y % sliders + NumFields. Preview bar and render use the offset; radius covers the bounds. Preserved in clone and fill keys.
- On-canvas angle drag for linear gradients: selecting a shape with a linear gradient shows a phosphor dashed line from the centre with a draggable end handle. Drag the handle to scrub the gradient angle live (Shift snaps to 15°). Accounts for node rotation. Commits on release. Inspector slider and NumField remain available.
- Gradient angle live scrub polish: Angle editor for linear gradients now pairs the range slider with a live editable NumField (0–360°, draft updates canvas, Enter/blur commits) and ° label, matching the solid opacity pattern. Slider still drives the on-canvas scrub chips.
- Radial gradients: Fill editor gains Linear / Radial toggle. Radial fills render with createRadialGradient centred on the node (stops map to radius). Preview bar switches to radial-gradient. Angle slider hidden for radial. Type preserved in clone, style clipboard, and fill keys/labels.
- Eyedropper sample status holds longer: successful samples (fill or stroke) now use holdStudioStatus so the message persists until the next inspector action; includes alpha % note when the sample is not fully opaque. Colour is still remembered into recent swatches.
- Gradient stop editors with denser brand + recent swatches: each gradient stop now shows the tight size-5 BrandSwatches and RecentSwatches under its hex field. Click applies the colour to that stop, remembers it, and updates the live preview bar.
- Eyedropper live preview chip polish: larger phosphor-bordered swatch with alpha % when <100, transparent checkerboard, position clamped inside canvas bounds.
- Eyedropper live preview chip under cursor: while the Eyedropper tool is active, a small phosphor-bordered chip follows the pointer showing the live sampled hex (or "transparent"). Click still samples and applies as before.
- Denser brand + recent one-click swatches in mixed-ink and type colour editors: mixed Fill, mixed Stroke, and type colour now use the tight size-5 phosphor BrandSwatches row (plus denser Recent) matching the solid Fill/Stroke pattern. Click applies the hex to the selection and remembers it.
- Gradient stop markers show offset % on hover (and while dragging).
- Live gradient stop markers on the preview bar (drag to scrub offset).
- Eyedropper tool samples canvas colour onto selected fill or stroke (Shift for stroke).
- Denser brand + recent one-click swatches in solid Fill and Stroke.
- Stroke opacity field next to stroke hex.
- Opacity field next to solid fill hex.
- Gradient stop offset % editable NumFields.
## Next recommended
- Live gradient angle chip polish for linear (already present; denser?)
- On-canvas linear gradient length / offset handle
## Backlog
22. On-canvas linear gradient angle handle for mixed selections (done)
21. Gradient stop editing in mixed selection (done)
1. Stroke opacity field next to stroke hex (done)
1. Present mode notes better UX (done)
2. Layer panel drag reorder polish (done)
3. Path point inspector more editable (done)
4. Export preset for common social sizes from studio (done)
5. Precise hex colour entry (done)
6. Gradient stop colour hex fields (done)
7. Gradient stop offset % editable fields (done)
8. Opacity field next to solid fill hex (done)
9. Stroke opacity field next to stroke hex (done)
10. Denser brand + recent swatches in solid Fill/Stroke (done)
11. Eyedropper tool samples canvas colour onto selected fill or stroke (done)
12. Live gradient stop markers on the preview bar (done)
13. Gradient stop markers show offset % on hover (done)
14. Brand / recent denser also in mixed-ink and type colour editors (done)
15. Radial gradients (done)
16. On-canvas angle drag for linear gradients (done)
17. Radial centre offset (done)
18. Mixed selection support for gradient fills (done)
19. Focal point (inner radius offset) for radial gradients (done)
20. Inner radius (r0) control for radial gradients (done)
