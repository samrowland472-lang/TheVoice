# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-25 02:05 BST — Present chrome treats a document-level pointer-move after the muted keep-clear Shift-held path through the pointer-over mute helper so a move cannot flash the next-frame name.

## Next recommended

Present chrome should treat a document-level pointer-down after that same muted keep-clear Shift-held path through the pointer-move mute helper so a down cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove delegates to the pointer-over helper.
- Present chrome routes document pointermove through applyQuietKeepClearPointerMove after the pointer-over mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver delegates to the pointer-enter helper.
- Present chrome routes document pointerover through applyQuietKeepClearPointerOver after the pointer-enter mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter delegates to the pointer-out helper.
- Present chrome routes document pointerenter through applyQuietKeepClearPointerEnter after the pointer-out mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut delegates to the pointer-leave helper.
- Present chrome routes document pointerout through applyQuietKeepClearPointerOut after the pointer-leave mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave delegates to the pointer-up helper.
- Present chrome routes pointerleave through applyQuietKeepClearPointerLeave after the pointer-up mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp delegates to the lost-capture helper.
- Present chrome routes pointerup through applyQuietKeepClearPointerUp after the lost-capture mute path.
- lostpointercapture is wired through applyQuietKeepClearLostPointerCapture after the pointer-cancel mute path.
- pointercancel is also wired through applyQuietKeepClearPointerCancel so a cancelled scrub stays muted.
- Naming an off-current tick on the pointer-over path still lifts mute and shows that frame.
