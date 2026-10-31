## Iteration 2026-10-31T02:10:00Z

**Done:** Fixed broken `inspector-path-impl.tsx` (was a placeholder "see previous"). Path point fields now render from the existing PathInspector. Single-selected paths show a dedicated Path section in the Inspector with point count, open/close, smooth/corner, drop last, and per-point X/Y, smooth toggle, and delete. Tab-order chrome remains in the wrapper.

**Next recommended:** Extend path inspector with hole support (add/remove holes, fill rule per hole) and wire the existing path-point-tab accessibility helpers so keyboard navigation across points and holes works end-to-end. Or deepen paint/brush tools.
