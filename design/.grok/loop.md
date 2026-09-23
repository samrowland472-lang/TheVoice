# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 22:20 BST — Shift-release after a quiet Escape keep stays muted so the fallback name does not flash on the peek strip.

## Next recommended

Shift-release after a muted pointer-up keep should not revive the next-frame fallback name if Shift is tapped again without hovering a named tick.

## Done

- peekCaptionAfterQuietEscapeShiftRelease keeps mute + hides fallback even when mute state had not flushed.
- peekCaptionAfterShiftRelease accepts quietEscapeKeep so a keep from Escape cannot unmute on Shift-up.
- Present chrome tracks quietEscapeKeep + mute/name refs so keyup Shift in the same tick as Escape stays dead.
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
