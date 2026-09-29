# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 17:05 BST — Present stack wraps like Campaign PDF (ArrowUp/Down). Peek strip ticks fade with PEEK_TICK_FADE_MS remaining, not a hard 1. Double-click peek opens notes; Escape stays quiet.

## Next recommended

Campaign PDF JPEG page smoke from Present (download campaign PDF while the peek rail is hidden). Named caption fade locked to tickRemaining.

## Done

- campaignStackNeighbor drives Present go(); wrap last→first.
- Peek strip remounted: data-present-peek, scrub, data-peek-tick, phosphor ticks.
- peekTickOpacity(Math.abs(n - i), tickRemaining) + dwell clock paused while notes visible.
- PresentNotesPanel on notesVisible (rail or peek double-click).
