# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-22 23:20 BST — Peek notes Escape stays quiet; tick fade pauses while notes are open.

## Next recommended

Shift-drag on the peek strip should name the scrubbed frame the same way shift-hover names a parked dot, without waking the campaign rail.

## Done

- Escape on a peek double-click notes panel closes notes only — campaign rail stays asleep.
- Peek tick fade clock holds while notes are visible (N or peek), then resumes the remaining dwell.
- Peek last-frame tick opacity is distance step × remaining dwell (neighbour 0.7 fading to 0; far ghost 0.14 fading to 0).
- Restored peek-tick wiring on the present strip (scrub trail, quiet-key / quiet-dot clear, fade clock, current-dot suppression, double-click notes).
- Peek last-frame tick opacity falls off with page-index distance: neighbour ~0.7, two away ~0.42, three ~0.26, farther a quiet 0.14 ghost.
