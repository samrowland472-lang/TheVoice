# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 18:55 BST — Quiet Home/End after a kept faded tick leave mute on and do not revive a dead named caption.

## Next recommended

Escape after a muted Home/End keep should not restore the next-frame fallback name while Shift is still held.

## Done

- Quiet Home/End after a kept faded tick should not revive a dead named caption when mute is still on.
- peekCaptionAfterQuietHomeEnd clears namedId and keeps mute; peekTickAfterQuietHomeEnd keeps the faded tick.
- Present chrome wires Home/End through those helpers before jumping to first/last frame.
- peekTickFadeShouldRestartAfterLostCapture gates the dwell reset on pointer-cancel and window blur.
- Peek tick fade restarts only when the landed id changes after a lost-capture keep, not when mute flips.
- Fade clock in present chrome uses peekTickFadeShouldRestart + PEEK_TICK_FADE_MS; mute is not a restart cause.
- Distant peek dots use peekTickOpacity(..., tickRemaining).
- Pointer-cancel mid-scrub applies peekAfterLostCapture (same mute + tick keep as pointer-up).
- Window blur mid-capture ends the scrub through that path before Shift-release mute.
