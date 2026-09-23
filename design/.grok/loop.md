# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 18:10 BST — Peek tick fade restarts only when the landed frame id changes after a lost-capture keep; mute flipping keeps the fade clock.

## Next recommended

Quiet Home/End after a kept faded tick should not revive a dead named caption when mute is still on.

## Done

- Peek tick fade restarts only when the landed id changes after a lost-capture keep, not when mute flips.
- peekTickFadeShouldRestartAfterLostCapture gates the dwell reset on pointer-cancel and window blur.
- Fade clock in present chrome uses peekTickFadeShouldRestart + PEEK_TICK_FADE_MS; mute is not a restart cause.
- Distant peek dots use peekTickOpacity(..., tickRemaining).
- Pointer-cancel mid-scrub applies peekAfterLostCapture (same mute + tick keep as pointer-up).
- Window blur mid-capture ends the scrub through that path before Shift-release mute.
- Muted lost capture with no stored tick still lands the live frame tick.
- Named caption stays dead when mute was already on.
- Pointer-up after muted Shift-scrub keeps the landed tick.
- That pointer-up keeps mute so the named caption (and next-frame fallback) stay dead.
- Shift-release (and window blur) mid-scrub after a named mute-land drops the caption.
- Mute stays on after that release so the next-frame fallback does not return.
- Shift remains a quiet present-nav key — the campaign rail stays asleep.
- Shift-scrub after muted Home/End names the frame under the pointer, including the current peek dot.
- Mid-scrub without a pointer id keeps mute so the next-frame fallback does not return.
- Current-dot hover mute still keeps the index chip only when not scrubbing.
- Leaving the current dot lifts mute so a parked name or fallback may return.
- Quiet Home/End mute the named peek caption (and the fallback next-frame name) even while Shift is still held.
