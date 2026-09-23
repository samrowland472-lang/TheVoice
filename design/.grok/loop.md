# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 18:58 BST — Escape after a muted Home/End keep stays in present and does not restore the next-frame fallback name while Shift is still held.

## Next recommended

Shift-release after a quiet Escape keep should stay muted so the fallback name does not flash on the peek strip.

## Done

- peekCaptionAfterQuietEscape clears namedId, keeps mute, and stays in present when Shift is held.
- Present chrome applies that helper on Escape before exit; muted Home/End still go through peekCaptionAfterQuietHomeEnd / peekTickAfterQuietHomeEnd.
- applyLostCapture + peekAfterLostCapture share pointer-cancel and window-blur mid-scrub.
- Quiet Home/End after a kept faded tick should not revive a dead named caption when mute is still on.
- peekCaptionAfterQuietHomeEnd clears namedId and keeps mute; peekTickAfterQuietHomeEnd keeps the faded tick.
- Present chrome wires Home/End through those helpers before jumping to first/last frame.
- peekTickFadeShouldRestartAfterLostCapture gates the dwell reset on pointer-cancel and window blur.
- Peek tick fade restarts only when the landed id changes after a lost-capture keep, not when mute flips.
- Fade clock in present chrome uses peekTickFadeShouldRestart + PEEK_TICK_FADE_MS; mute is not a restart cause.
- Distant peek dots use peekTickOpacity(..., tickRemaining).
- Pointer-cancel mid-scrub applies peekAfterLostCapture (same mute + tick keep as pointer-up).
- Window blur mid-capture ends the scrub through that path before Shift-release mute.
