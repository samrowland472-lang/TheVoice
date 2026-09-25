# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-25 15:10 BST — Present chrome treats a second document-level pointerleave after the muted keep-clear Shift-held path through the document pointer-move mute helper so a second document pointer-leave cannot flash the next-frame name.

## Next recommended

Present chrome should treat a document-level pointerout after that same muted keep-clear Shift-held path through the document pointer-leave mute helper so a second document pointer-out cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerLeave delegates to the document pointer-move helper.
- Present chrome routes a second document pointerleave through applyQuietKeepClearDocPointerLeave after the document pointer-move mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerMove delegates to the document pointer-down helper.
- Present chrome routes a second document pointermove through applyQuietKeepClearDocPointerMove after the document pointer-down mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown delegates to the document pointer-up helper.
- Present chrome routes a second document pointerdown through applyQuietKeepClearDocPointerDown after the document pointer-up mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp delegates to the document lostpointercapture helper.
- Present chrome routes document pointerup through applyQuietKeepClearDocPointerUp after the document lostpointercapture mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocLostPointerCapture delegates to the document pointer-cancel helper.
- Present chrome routes document lostpointercapture through applyQuietKeepClearDocLostPointerCapture after the document pointer-cancel mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerCancel delegates to the pointer-down helper.
- Present chrome routes document pointercancel through applyQuietKeepClearDocPointerCancel after the pointer-down mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerDown delegates to the pointer-move helper.
- Present chrome routes document pointerdown through applyQuietKeepClearPointerDown after the pointer-move mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove delegates to the pointer-over helper.
- Present chrome routes document pointermove through applyQuietKeepClearPointerMove after the pointer-over mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver delegates to the pointer-enter helper.
- Present chrome routes document pointerover through applyQuietKeepClearPointerOver after the pointer-over mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter delegates to the pointer-out helper.
- Present chrome routes document pointerenter through applyQuietKeepClearPointerEnter after the pointer-enter mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut delegates to the pointer-leave helper.
- Present chrome routes document pointerout through applyQuietKeepClearPointerOut after the pointer-leave mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave delegates to the pointer-up helper.
- Present chrome routes pointerleave through applyQuietKeepClearPointerLeave after the pointer-up mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp delegates to the lost-capture helper.
- Present chrome routes pointerup through applyQuietKeepClearPointerUp after the lost-capture mute path.
- lostpointercapture is wired through applyQuietKeepClearLostPointerCapture after the pointer-cancel mute path.
- pointercancel is also wired through applyQuietKeepClearPointerCancel so a cancelled scrub stays muted.
- Naming an off-current tick on the pointer-over path still lifts mute and shows that frame.
