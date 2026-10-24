# The Voice Design — Improvement Loop

## Done
- Clipboard and selection actions now work: Duplicate (Cmd+D), Copy (Cmd+C), Cut (Cmd+X), Paste (Cmd+V), Remove (Delete), Select all (Cmd+A).
- Groups and their children are cloned together with remapped parent IDs.
- Layers panel has a Duplicate button next to Group / Ungroup.
- Command palette lists Duplicate, Copy, Cut, and Paste.
- Fit artboard and zoom shortcuts set view intent correctly.
- Layers panel rows now include a compact opacity scrubber for direct per-layer opacity tweaks without leaving the list.
- Opacity scrubber in Layers rows is now hover-only (or always visible when the layer is selected) with a larger hit target for better usability.

## Iteration
2026-10-24 03:15 BST — Polished Layers panel opacity scrubber: hover-only visibility (visible when selected), larger width/height for improved touch targets. Verified typecheck, build, and browser smoke.

## Next recommended
- Deepen path point inspector or add live dash/offset preview on the canvas.
- Or add keyboard shortcuts for opacity tenths directly from the layers list.
