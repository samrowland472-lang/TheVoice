# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-22 23:26 BST — Shift-drag on the peek strip names the scrubbed frame.

## Next recommended

Quiet-key Home/End from a named peek caption should clear the name the same way they already clear the last-frame tick, without waking the campaign rail.

## Done

- Shift-drag (or Shift+pointer) on the peek strip names the frame under the pointer, even after that frame becomes current.
- Shift-hover on a parked peek dot still names only the non-current frame.
- Peek pointer work stays on `[data-present-peek]` so scrub naming does not wake the campaign rail.
- Escape on a peek double-click notes panel closes notes only — campaign rail stays asleep.
- Peek tick fade clock holds while notes are visible (N or peek), then resumes the remaining dwell.
- Peek last-frame tick opacity is distance step × remaining dwell (neighbour 0.7 fading to 0; far ghost 0.14 fading to 0).
- Restored peek-tick wiring on the present strip (scrub trail, quiet-key / quiet-dot clear, fade clock, current-dot suppression, double-click notes).
- Peek last-frame tick opacity falls off with page-index distance: neighbour ~0.7, two away ~0.42, three ~0.26, farther a quiet 0.14 ghost.
