## Iteration 2026-10-31T03:05:00Z

**Done:** Extended Path Inspector with hole support. Single-selected paths now list holes (cutouts) with per-hole point counts, Even-odd / Nonzero fill rule toggles, delete, and editable X/Y + smooth/corner per hole point. "Add hole" inserts a centered rectangle cutout. Outer points and hole points carry `data-point` / `data-path-axis` so the existing path-point-tab keyboard helpers can walk points and holes. Tab-order chrome in the wrapper continues to drive the crossings.

**Next recommended:** Wire remaining path-point-tab edge cases (fill/delete header crossings when holes have no point fields) or deepen brush/paint stroke preview in the inspector.
