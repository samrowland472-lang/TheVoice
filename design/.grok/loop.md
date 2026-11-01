# The Voice Design — loop

## Done
- Iteration: Path point multi-select + Nudge. Shift-click anchors toggles selection (phosphor fills when 2+). Arrow keys nudge the selected points (or the active edit hit) in local space instead of the whole path. Status strip reports count. Typecheck + build + browser-smoke clean (canvas live, no page errors).
- Iteration: Path point align + distribute. When 2+ anchors are multi-selected on a single path, the Path inspector shows L/C/R and T/M/B buttons that snap the selected points to the selection bounds (local space). With 3+ points, Dist H / Dist V space them evenly between extremes. Status strip reports the action. Builds on the multi-select phosphor highlights and nudge. Typecheck + build + browser-smoke clean.
- Iteration: Multi-select marquee. Drag on empty canvas draws a phosphor dashed marquee. On a single selected path it selects anchors inside the rect (additive with Shift). Otherwise it selects intersecting layers. Multi-selected path points now show a group bounding box. Status strip reports the count. Typecheck + build + browser-smoke clean (canvas live, no page errors).

## Iteration
2026-11-01T14:10Z — Multi-select marquee for path points and layers, plus group bounding box on multi-selected anchors.

## Next recommended
- Shared rotation handle on the path-point group bounding box.
- Or: knife tool live stroke on canvas.
- Or: path point alignment handles / live preview while scrubbing.
