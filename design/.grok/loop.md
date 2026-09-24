# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 21:07 BST — Present chrome treats a pointer-leave after the muted keep-clear Shift-held path through the pointer-up mute helper so a leave cannot flash the next-frame name.

## Next recommended

Present chrome should treat a document-level pointer-out after that same muted keep-clear Shift-held path through the pointer-leave mute helper so an out cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave delegates to the pointer-up helper.
- Present chrome routes pointerleave through applyQuietKeepClearPointerLeave after the pointer-up mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp delegates to the lost-capture helper.
- Present chrome routes pointerup through applyQuietKeepClearPointerUp after the lost-capture mute path.
- lostpointercapture is wired through applyQuietKeepClearLostPointerCapture after the pointer-cancel mute path.
- pointercancel is also wired through applyQuietKeepClearPointerCancel so a cancelled scrub stays muted.
- Naming an off-current tick on the pointer-leave path still lifts mute and shows that frame.
