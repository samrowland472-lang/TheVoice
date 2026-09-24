# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 18:16 BST — Lost pointer capture mid muted keep-clear Shift-held path reuses the pointer-cancel mute helper so a stolen pointer cannot flash the next-frame name.

## Next recommended

Present chrome should treat a pointer-up after that same muted keep-clear Shift-held path through the lost-capture mute helper so a late up cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture delegates to the pointer-cancel helper.
- Present chrome routes lostpointercapture through applyQuietKeepClearLostPointerCapture after the pointer-cancel mute path.
- pointercancel is also wired through applyQuietKeepClearPointerCancel so a cancelled scrub stays muted.
- Naming an off-current tick on the lost-capture path still lifts mute and shows that frame.
