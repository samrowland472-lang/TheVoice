# The Voice Design — Improvement Loop

## Done
- Restored full `inspector-print.tsx` (from f79b73f4) after placeholder pushes broke the Print rail.
- Added mixed-selection polish for guide look presets: dashed phosphor ring + softer styling when some but not all selected guides match a preset; title shows “N of M”; click unifies and status reflects it. Full match keeps solid ring. Uses current guideLooks for accurate resolve.
- Verified: `npm run typecheck` clean, `npm run build` succeeds, browser-smoke passes (canvas present, no console/page errors, brand/auth clean).

## Iteration
- **48** — 2026-11-22 ~06:05 UTC — Guide look preset mixed-selection active state
  - Slice: partial (dashed ring) vs full (solid ring) active styling + aria-pressed="mixed" for look presets when selection is heterogeneous. Click on partial unifies all selected (or all if none).
  - Phosphor-on-ground language preserved; no new chrome.

## Next recommended
- Deepen path-point inspector / knife tool feedback.
- Or layer filter jump + multi-match polish if any edge cases remain.
- Or guide color/dash cycle bulk consistency with the new mixed look state.
