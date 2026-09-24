# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 01:20 BST — A named off-current peek tick after a muted pointer-up keep clears mutedPointerUpKeep so a later current-dot hover names the live frame instead of the next-frame fallback.

## Next recommended

Leaving an off-current named tick after that keep-clear should not restore mutedPointerUpKeep if the pointer returns to the current dot.

## Done

- Named off-current hover after muted pointer-up keep clears mutedPointerUpKeep; later current-dot hover names the live frame, not the next-frame fallback.
- peekCaptionAfterMutedPointerUpCurrentHover returns mutedPointerUpKeep; present chrome writes the ref on hover/focus.
- peekCaptionAfterMutedPointerUpCurrentHover keeps mute + hides fallback on current-page hover after muted pointer-up keep.
- Off-current named hover unmutes and names that tick.
- peekCaptionAfterCurrentDotHover / peekCaptionAfterLeaveCurrentDot honor mutedPointerUpKeep.
- Present chrome wires hover/focus through the helper and tracks mutedPointerUpKeep + mute/name refs.
- peekCaptionAfterMutedPointerUpShiftRelease + mutedPointerUpKeep on Shift tap after pointer-up keep.
- peekCaptionAfterShiftRelease accepts mutedPointerUpKeep.
- peekCaptionAfterMutedPointerUpShiftRelease keeps mute + hides fallback even when mute state had not flushed.
- peekCaptionAfterShiftRelease accepts mutedPointerUpKeep so a keep from pointer-up cannot unmute on Shift-up or a later Shift tap.
- Present chrome tracks mutedPointerUpKeep + quietEscapeKeep + mute/name refs so keyup Shift after a muted pointer-up stays dead.
- Named off-current tick hover still clears both keep flags and names the tick.
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
