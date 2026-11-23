# The Voice Design · Improvement Loop

## Done
- Zoom controls in top bar: − / % (click → 100%) / + / Fit. Fixed missing viewIntent "zoom" handler so keyboard and UI zoom actually work (keeps view center).
- Gradient stop editor depth: live preview bar, % readout, add/remove stops (min 2), sorted display, commit on scrub end.
- Multi-select distribute preview: gap NumField in inspector (live scrub), phosphor equal-spacing connectors + midpoint ticks between ghosts.
- Distribute gap polish: live range slider + NumField draft updates, Natural reset, per-connector gap labels on canvas, shorter Commit.
- Image crop handles: live crop on selected photo/paint (source box dashed, crop frame with phosphor squares). Drag corners/edges to crop (source frozen). Alt+arrows nudge an edge. Crop now drawn correctly via source rect.
- Crop polish: Shift locks aspect on corner drags (anchors opposite corner). Live phosphor chip on the crop frame shows %×% size. Status and inspector copy updated.
- Social export presets: in the Export menu, pick a Social size (IG Post, Story, X Post, etc.) and export a temporary magic-resized PNG at that size (original artboard unchanged).

## Iteration
- 2026-11-23T00:12Z — Social export presets: Export menu gains a Social preset select + Export PNG that scales the current board (magic style, paint baked) to the chosen format and downloads without mutating the document. Typecheck, build, smoke clean.

## Next recommended
- Layer panel drag reorder polish
- Path point inspector more editable
- Present mode notes better UX
- Keyboard shortcut overlay in command palette

## Backlog
1. Keyboard shortcut overlay in command palette
2. Path point inspector more editable
3. Layer panel drag reorder polish
4. Present mode notes better UX
5. Export preset for common social sizes from studio (done)