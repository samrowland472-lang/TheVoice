# The Voice Design · Improvement Loop

## Done
- Zoom controls in top bar: − / % (click → 100%) / + / Fit. Fixed missing viewIntent "zoom" handler so keyboard and UI zoom actually work (keeps view center).
- Gradient stop editor depth: live preview bar, % readout, add/remove stops (min 2), sorted display, commit on scrub end.
- Multi-select distribute preview: gap NumField in inspector (live scrub), phosphor equal-spacing connectors + midpoint ticks between ghosts.
- Distribute gap polish: live range slider + NumField draft updates, Natural reset, per-connector gap labels on canvas, shorter Commit.
- Image crop handles: live crop on selected photo/paint (source box dashed, crop frame with phosphor squares). Drag corners/edges to crop (source frozen). Alt+arrows nudge an edge. Crop now drawn correctly via source rect.

## Iteration
- 2026-11-22T22:15Z — Image crop handles polish: interactive crop drag on canvas for single selected bitmap, source outline, Alt+arrow edge nudge, proper crop rendering. Typecheck, build, smoke clean.

## Next recommended
- Layer panel drag reorder polish
- Path point inspector more editable
- Present mode notes better UX
- Export preset for common social sizes from studio

## Backlog
1. Export preset for common social sizes from studio
2. Keyboard shortcut overlay in command palette
3. Path point inspector more editable
4. Layer panel drag reorder polish
5. Present mode notes better UX
