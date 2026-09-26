# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-26 09:07 BST — Present chrome treats a second document-level pointerup after the muted keep-clear Shift-held path through the document lostpointercapture mute helper so a second document pointer-up cannot flash the next-frame name.

## Next recommended

Present chrome should treat a second document-level pointercancel after that same muted keep-clear Shift-held path through the second document pointer-up mute helper so a second document pointer-cancel cannot flash the next-frame name.

## Done

- applyQuietKeepClearDocSecondPointerUp calls applyQuietKeepClearDocLostPointerCapture then the second document pointer-up peek helper so a second document pointer-up cannot flash the next-frame name.
- Document pointerup also runs applyQuietKeepClearDocSecondPointerUp after applyQuietKeepClearDocPointerUp.
- applyQuietKeepClearDocLostPointerCapture calls applyQuietKeepClearDocPointerCancel then the document lostpointercapture peek helper so a second document lostpointercapture cannot flash the next-frame name.
- Document lostpointercapture is wired through onDocLostPointerCapture.
- applyQuietKeepClearDocPointerCancel calls applyQuietKeepClearDocPointerUp then the document pointer-cancel peek helper so a second document pointer-cancel cannot flash the next-frame name.
- Document pointercancel is wired through onDocPointerCancel.
- applyQuietKeepClearDocPointerUp calls applyQuietKeepClearDocPointerDown then the document pointer-up peek helper so a second document pointer-up cannot flash the next-frame name.
- Document pointerup is wired through onDocPointerUp.
- applyQuietKeepClearDocPointerDown calls applyQuietKeepClearDocPointerMove then the document pointer-down peek helper so a second document pointer-down cannot flash the next-frame name.
- Document pointerdown is wired through onDocPointerDown.
- applyQuietKeepClearDocPointerMove calls applyQuietKeepClearDocPointerOver then the document pointer-move peek helper so a second document pointer-move cannot flash the next-frame name.
- Document pointermove is wired through onDocPointerMove.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerOver delegates to the document pointer-enter helper.
- Present chrome routes a second document pointerover through applyQuietKeepClearDocPointerOver after the document pointer-enter mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerEnter delegates to the document pointer-out helper.
- Present chrome routes a second document pointerenter through applyQuietKeepClearDocPointerEnter after the document pointer-out mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerOut delegates to the document pointer-leave helper.
- Present chrome routes a second document pointerout through applyQuietKeepClearDocPointerOut after the document pointer-leave mute path.
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
- Present chrome routes document pointercancel through applyQuietKeepClearDocPointerCancel after the pointer-up mute path.
- Naming an off-current tick on the pointer-over path still lifts mute and shows that frame.
