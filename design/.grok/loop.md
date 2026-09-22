# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-22 21:22 BST — Peek trail ticks fall off with distance from the current-dot.

## Next recommended

Peek tick should also dim while the fade clock runs (opacity × remaining dwell) so a far neighbour does not stay at a hard step until it vanishes.

## Done

- Peek last-frame tick opacity falls off with page-index distance: neighbour ~0.7, two away ~0.42, three ~0.26, farther a quiet 0.14 ghost.
- Restored peek-tick wiring on the present strip (scrub trail, quiet-key / quiet-dot clear, fade clock, current-dot suppression, double-click notes).
