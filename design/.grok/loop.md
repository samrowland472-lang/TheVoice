# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-23 01:20 BST — Quiet Home/End clear a named peek caption without waking the campaign rail.

## Next recommended

Shift-hover a parked peek dot after Home/End should name that frame again without needing to release Shift first.

## Done

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
