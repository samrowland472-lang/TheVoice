# The Voice Design — loop

## Done
- Iteration: Shared rotation handle on path-point group bounding box. When 2+ anchors are multi-selected on a single path, the phosphor group box gains a rotation handle (line + circle) at the top center. Dragging it rotates the selected points (and their Bézier handles) around the selection center in local space. Shift snaps to 15°. Status strip reports the angle. Builds on multi-select, marquee, nudge, and align. Typecheck + build + browser-smoke clean (canvas live, no page errors).
- Iteration: Multi-select marquee. Drag on empty canvas draws a phosphor dashed marquee. On a single selected path it selects anchors inside the rect (additive with Shift). Otherwise it selects intersecting layers. Multi-selected path points now show a group bounding box. Status strip reports the count. Typecheck + build + browser-smoke clean (canvas live, no page errors).
- Iteration: Path point align + distribute. When 2+ anchors are multi-selected on a single path, the Path inspector shows L/C/R and T/M/B buttons that snap the selected points to the selection bounds (local space). With 3+ points, Dist H / Dist V space them evenly between extremes. Status strip reports the action. Builds on the multi-select phosphor highlights and nudge. Typecheck + build + browser-smoke clean.
- Iteration: Path point multi-select + Nudge. Shift-click anchors toggles selection (phosphor fills when 2+). Arrow keys nudge the selected points (or the active edit hit) in local space instead of the whole path. Status strip reports count. Typecheck + build + browser-smoke clean (canvas live, no page errors).

## Iteration
2026-11-01T15:10Z — Shared rotation handle on the path-point group bounding box. Drag rotates selected anchors + handles around the group center (Shift snaps 15°).

## Next recommended
- Knife tool live stroke on canvas.
- Or: path point alignment handles / live preview while scrubbing.
- Or: scale handles on the path-point group bounding box.