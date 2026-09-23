# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 07:27 BST — Shift-hover after quiet Home/End names a parked peek frame again without releasing Shift.

## Next recommended

Shift-hover the current-dot after a muted Home/End should keep the index only — never revive the next-frame fallback until the pointer leaves that dot.

## Done

- Quiet Home/End mute the named peek caption (and the fallback next-frame name) even while Shift is still held.
- Shift-hover or Shift-scrub a parked peek dot after that mute names the frame under the pointer without releasing Shift first.
- Releasing Shift, or blurring the window, clears mute and the named id.
- Campaign rail stays asleep — Home/End remain quiet present-nav keys.
- Quiet Home/End drop the named peek caption (and the fallback next-frame name) even while Shift is still held.
- Campaign rail stays asleep — Home/End remain quiet present-nav keys.
- Releasing Shift, or blurring the window, also clears the caption.
- Shift-hover on a parked peek dot can name a frame again after the caption was cleared.
- Shift-drag (or Shift+pointer) on the peek strip names the frame under the pointer, even after that frame becomes current.
- Shift-hover on a parked peek dot still names only the non-current frame.
- Peek pointer work stays on `[data-present-peek]` so scrub naming does not wake the campaign rail.
- Escape on a peek double-click notes panel closes notes only — campaign rail stays asleep.
- Peek tick fade clock holds while notes are visible (N or peek), then resumes the remaining dwell.
- Peek last-frame tick opacity is distance step × remaining dwell (neighbour 0.7 fading to 0; far ghost 0.14 fading to 0).
- Restored peek-tick wiring on the present strip (scrub trail, quiet-key / quiet-dot clear, fade clock, current-dot suppression, double-click notes).
- Peek last-frame tick opacity falls off with page-index distance: neighbour ~0.7, two away ~0.42, three ~0.26, farther a quiet 0.14 ghost.
