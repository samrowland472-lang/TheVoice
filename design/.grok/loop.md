# The Voice Design · Improvement Loop

## Done
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
- Gradient stop markers show offset % on hover (and while dragging): a small phosphor chip appears above the marker with the live percent.
- Live gradient stop markers on the preview bar: each stop is a small phosphor-bordered square (filled with its colour) positioned by offset. Drag left/right to scrub the offset live (commits on release). Markers stay in sync with the % fields and sliders below.
- Eyedropper tool samples canvas colour onto selected fill or stroke: click with the I tool (or pick Eyedropper) to sample the rendered pixel under the cursor; applies as solid fill to the selection (Shift applies as stroke, ensuring width ≥ 1). Remembers the colour, shows status, and returns to Select. Transparent samples are ignored.
- Denser brand + recent one-click swatches in solid Fill and Stroke editors: brand kit colours appear as a tight row of size-5 phosphor-ready chips above recent colours (also densified to size-5 / gap-1). Click applies the hex to fill or stroke and remembers it.
- Stroke opacity field next to stroke hex: Stroke editor shows a live % NumField (0–100, draft updates canvas, Enter/blur commits) beside the hex and colour picker, matching the solid Fill pattern (controls the same node opacity).
- Opacity field next to solid fill hex: solid Fill editor shows a live % NumField (0–100, draft updates canvas, Enter/blur commits) beside the hex and colour picker.
- Gradient stop offset % fields: each stop's % readout is now a live editable NumField (0–100, draft updates canvas, Enter/blur commits). Hex colour, offset slider and Remove stay beside it.
- Gradient stop colour hex fields: each stop now pairs the colour picker with a live hex text field (normalises #rgb/#rrggbb, Enter/blur commits, Esc reverts). Offset slider and Remove stay under the hex row.
- Precise hex colour entry: Fill, Stroke and Shadow editors now pair the colour picker with a live hex text field (normalises #rgb/#rrggbb, Enter/blur commits, Esc reverts). Recent swatches unchanged.
- Present mode notes polish: resizable drawer height (drag phosphor bar, 120–420px, persisted), estimated speaking time (~140 wpm) next to word/char count.
- Zoom controls in top bar: − / % (click → 100%) / + / Fit. Fixed missing viewIntent "zoom" handler so keyboard and UI zoom actually work (keeps view center).
- Gradient stop editor depth: live preview bar, % readout, add/remove stops (min 2), sorted display, commit on scrub end.
- Multi-select distribute preview: gap NumField in inspector (live scrub), phosphor equal-spacing connectors + midpoint ticks between ghosts.
- Distribute gap polish: live range slider + NumField draft updates, Natural reset, per-connector gap labels on canvas, shorter Commit.
- Image crop handles: live crop on selected photo/paint (source box dashed, crop frame with phosphor squares). Drag corners/edges to crop (source frozen). Alt+arrows nudge an edge. Crop now drawn correctly via source rect.
- Crop polish: Shift locks aspect on corner drags (anchors opposite corner). Live phosphor chip on the crop frame shows %×% size. Status and inspector copy updated.
- Social export presets: in the Export menu, pick a Social size (IG Post, Story, X Post, etc.) and export a temporary magic-resized PNG at that size (original artboard unchanged).
- Keyboard shortcut overlay in command palette: footer “Shortcuts” switches the palette to a filterable, categorized list of tool, edit, view, path, and nudge bindings (phosphor keys). Esc or Back returns to commands.
- Path point inspector more editable: for each smooth (or handled) point in the Path inspector, live In/Out handle offset NumFields (relative to anchor) plus a Clear control that forces corner. Works for outer path and holes.
- Layer panel drag reorder polish: floating phosphor ghost follows the cursor with the layer name (or count), live status strip describes the drop ("Nest into …", "Place before …"), thicker insertion bars, illegal drops stay grey.
- Present mode notes better UX: speaker notes drawer now renders in present (N / Notes toggle). Live word/char count, placeholder, caret restore + jump-to-last-edit, taller drawer. Notes persist per frame via localStorage.

## Iteration
- 2026-11-24T17:08Z — Mixed selection support for gradient fills. Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T09:07Z — Radial centre offset (on-canvas phosphor cross handle + inspector % controls, rotation-aware, Shift snap). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T08:05Z — On-canvas angle drag for linear gradients (phosphor handle from centre, live scrub, Shift snap 15°, rotation-aware). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T07:10Z — Gradient angle live scrub polish (NumField beside slider, draft updates, commits on Enter/blur). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T06:06Z — Radial gradients (Linear/Radial toggle, canvas + preview support, angle hidden for radial). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T05:01Z — Eyedropper sample status holds longer (held status + alpha note). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T04:08Z — Gradient stop editors with denser brand + recent swatches. Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T03:04Z — Eyedropper live preview chip polish (alpha, clamp, checker). Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T02:15Z — Eyedropper live preview chip under cursor. Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T01:15Z — Denser brand + recent swatches in mixed-ink (fill + stroke) and type colour editors. Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T00:10Z — Gradient stop markers show offset % on hover and while dragging. Typecheck, build, smoke clean (hub content visible).
- 2026-11-23T23:10Z — Live gradient stop markers on the preview bar (drag to scrub offset). Typecheck, build, smoke clean (hub content visible).
- 2026-11-23T22:10Z — Eyedropper tool samples canvas colour onto selected fill or stroke (Shift for stroke). Typecheck, build, smoke clean.
- 2026-11-23T20:05Z — Denser brand + recent one-click swatches in solid Fill and Stroke. Typecheck, build, smoke clean.
- 2026-11-23T19:15Z — Stroke opacity field next to stroke hex. Typecheck, build, smoke clean.
- 2026-11-23T17:07Z — Opacity field next to solid fill hex. Typecheck, build, smoke clean.
- 2026-11-23T08:07Z — Gradient stop offset % editable NumFields. Typecheck, build, smoke clean.
## Next recommended
- Focal point (inner radius offset) for radial gradients
- Gradient stop editing in mixed selection
## Backlog
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
