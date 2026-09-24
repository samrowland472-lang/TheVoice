# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 17:09 BST — Pointer-cancel mid muted keep-clear Shift-held path reuses the window-blur mute helper so a cancelled scrub cannot flash the next-frame name.

## Next recommended

Lost pointer capture mid that same muted keep-clear Shift-held path should reuse the pointer-cancel mute helper so a stolen pointer cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel delegates to the window-blur helper.
- Present chrome routes pointercancel through applyQuietKeepClearPointerCancel after the window-blur mute path.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur still covers focus loss.
- Naming an off-current tick on the cancel path still lifts mute and shows that frame.
