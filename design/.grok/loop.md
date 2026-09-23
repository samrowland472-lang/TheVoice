# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 10:18 BST — Shift-scrub across the current peek dot after mute names the landing frame; next-frame fallback stays dead mid-scrub.

## Next recommended

Shift-release mid-scrub after a named mute-land should drop the caption without waking the campaign rail.

## Done

- Shift-scrub after muted Home/End names the frame under the pointer, including the current peek dot.
- Mid-scrub without a pointer id keeps mute so the next-frame fallback does not return.
- Current-dot hover mute still keeps the index chip only when not scrubbing.
- Leaving the current dot lifts mute so a parked name or fallback may return.
- Quiet Home/End mute the named peek caption (and the fallback next-frame name) even while Shift is still held.
- Releasing Shift, or blurring the window, still clears mute and the named id.
- Campaign rail stays asleep — Home/End remain quiet present-nav keys.
