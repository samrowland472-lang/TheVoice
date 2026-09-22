# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-22 22:15 BST — Peek trail ticks dim with remaining fade dwell.

## Next recommended

Speaker-notes panel from a peek double-click should close on Escape without waking the campaign rail, and the tick fade clock should pause while notes are open.

## Done

- Peek last-frame tick opacity is distance step × remaining dwell (neighbour 0.7 fading to 0; far ghost 0.14 fading to 0).
- Restored peek-tick wiring on the present strip (scrub trail, quiet-key / quiet-dot clear, fade clock, current-dot suppression, double-click notes).
- Peek last-frame tick opacity falls off with page-index distance: neighbour ~0.7, two away ~0.42, three ~0.26, farther a quiet 0.14 ghost.
