# The Voice Design — Improvement Loop

## Done
- Clipboard and selection actions now work: Duplicate (Cmd+D), Copy (Cmd+C), Cut (Cmd+X), Paste (Cmd+V), Remove (Delete), Select all (Cmd+A).
- Groups and their children are cloned together with remapped parent IDs.
- Layers panel has a Duplicate button next to Group / Ungroup.
- Command palette lists Duplicate, Copy, Cut, and Paste.
- Fit artboard and zoom shortcuts set view intent correctly.
- Layers panel rows now include a compact opacity scrubber for direct per-layer opacity tweaks without leaving the list.
- Opacity scrubber in Layers rows is now hover-only (or always visible when the layer is selected) with a larger hit target for better usability.
- Layers opacity control now includes a clickable percent badge that opens an inline number field for exact percent entry (Enter/Escape), alongside the scrubber.
- Path point inspector now shows Bézier in/out handle offsets (when present) plus Smooth / Corner / Delete actions on every point row.
- Live phosphor dash/offset ghost overlay on the canvas while scrubbing Stroke Dash or Offset in the inspector.
- Live phosphor overlay while scrubbing Stroke Width, and hover/focus/change preview for Cap and Join selects (consistent with dash ghost).
- Live phosphor overlay while scrubbing Stroke Miter Limit, Polygon/Star Sides, and Arrow Head Scale (same ghost system).

## Iteration
2026-10-24 08:10 BST — Extended the live phosphor stroke ghost to Miter Limit, polygon/star Sides, and arrow Head Scale. Scrubbing those ranges now shows the outline ghost on the artboard before commit, matching Width/Dash/Cap/Join. Verified typecheck, build, and browser smoke.

## Next recommended
- Add more precise opacity shortcuts (e.g. Alt+Arrow for 1% steps) while the layers list is focused.
- Or deepen path point inspector further with mirrored-handle toggle and live tangent overlay.
- Or add live ghost for Radius on rects and Fill Rule on holed paths (already partially wired).
