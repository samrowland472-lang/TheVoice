# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 19:06 BST — Present chrome treats a pointer-up after the muted keep-clear Shift-held path through the lost-capture mute helper so a late up cannot flash the next-frame name.

## Next recommended

Present chrome should treat a pointer-leave after that same muted keep-clear Shift-held path through the pointer-up mute helper so a leave cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp delegates to the lost-capture helper.
- Present chrome routes pointerup through applyQuietKeepClearPointerUp after the lost-capture mute path.
- lostpointercapture is wired through applyQuietKeepClearLostPointerCapture after the pointer-cancel mute path.
- pointercancel is also wired through applyQuietKeepClearPointerCancel so a cancelled scrub stays muted.
- Naming an off-current tick on the pointer-up path still lifts mute and shows that frame.
