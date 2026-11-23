# The Voice Design · Improvement Loop

## Done
- Zoom controls in top bar: − / % (click → 100%) / + / Fit. Fixed missing viewIntent "zoom" handler so keyboard and UI zoom actually work (keeps view center).
- Gradient stop editor depth: live preview bar, % readout, add/remove stops (min 2), sorted display, commit on scrub end.
- Multi-select distribute preview: gap NumField in inspector (live scrub), phosphor equal-spacing connectors + midpoint ticks between ghosts.
- Distribute gap polish: live range slider + NumField draft updates, Natural reset, per-connector gap labels on canvas, shorter Commit.
- Image crop handles: live crop on selected photo/paint (source box dashed, crop frame with phosphor squares). Drag corners/edges to crop (source frozen). Alt+arrows nudge an edge. Crop now drawn correctly via source rect.
- Crop polish: Shift locks aspect on corner drags (anchors opposite corner). Live phosphor chip on the crop frame shows %×% size. Status and inspector copy updated.
- Social export presets: in the Export menu, pick a Social size (IG Post, Story, X Post, etc.) and export a temporary magic-resized PNG at that size (original artboard unchanged).
- Keyboard shortcut overlay in command palette: footer “Shortcuts” switches the palette to a filterable, categorized list of tool, edit, view, path, and nudge bindings (phosphor keys). Esc or Back returns to commands.

## Iteration
- 2026-11-23T01:05Z — Keyboard shortcut overlay in command palette: open the palette (⌘K or ?), hit Shortcuts in the footer for a searchable reference of the main bindings. Typecheck, build, smoke clean.

## Next recommended
- Layer panel drag reorder polish
- Path point inspector more editable
- Present mode notes better UX

## Backlog
1. Path point inspector more editable
2. Layer panel drag reorder polish
3. Present mode notes better UX
4. Export preset for common social sizes from studio (done)
