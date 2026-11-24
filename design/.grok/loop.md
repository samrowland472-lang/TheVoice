# The Voice Design · Improvement Loop

## Done
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
- 2026-11-24T01:15Z — Denser brand + recent swatches in mixed-ink (fill + stroke) and type colour editors. Typecheck, build, smoke clean (hub content visible).
- 2026-11-24T00:10Z — Gradient stop markers show offset % on hover and while dragging. Typecheck, build, smoke clean (hub content visible).
- 2026-11-23T23:10Z — Live gradient stop markers on the preview bar (drag to scrub offset). Typecheck, build, smoke clean (hub content visible).
- 2026-11-23T22:10Z — Eyedropper tool samples canvas colour onto selected fill or stroke (Shift for stroke). Typecheck, build, smoke clean.
- 2026-11-23T20:05Z — Denser brand + recent one-click swatches in solid Fill and Stroke. Typecheck, build, smoke clean.
- 2026-11-23T19:15Z — Stroke opacity field next to stroke hex. Typecheck, build, smoke clean.
- 2026-11-23T17:07Z — Opacity field next to solid fill hex. Typecheck, build, smoke clean.
- 2026-11-23T08:07Z — Gradient stop offset % editable NumFields. Typecheck, build, smoke clean.
## Next recommended
- Eyedropper live preview chip under cursor
- Mixed gradient stop editors with denser swatches
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
