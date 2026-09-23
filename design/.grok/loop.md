# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 08:32 BST — Shift-hover the current peek dot after a muted Home/End keeps the index only; next-frame fallback stays dead until the pointer leaves that dot.

## Next recommended

Shift-scrub across the current peek dot after mute should name the landing frame without reviving the next-frame fallback mid-scrub.

## Done

- After muted Home/End, Shift-hover on the current peek dot keeps the index chip only.
- Next-frame fallback does not return while the pointer is still on that current dot.
- Leaving the current dot lifts mute so the next-frame name may return, or a parked Shift-hover may name that frame.
- Releasing Shift, or blurring the window, still clears mute and the named id.
- Quiet Home/End mute the named peek caption (and the fallback next-frame name) even while Shift is still held.
- Shift-hover or Shift-scrub a parked peek dot after that mute names the frame under the pointer without releasing Shift first.
- Campaign rail stays asleep — Home/End remain quiet present-nav keys.
