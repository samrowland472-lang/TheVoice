# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 12:35 BST — Pointer-up after a muted Shift-scrub keeps the landed tick and does not revive the named peek caption.

## Next recommended

Pointer-cancel and window blur mid-capture should use the same muted pointer-up path so the landed tick survives a lost capture.

## Done

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
