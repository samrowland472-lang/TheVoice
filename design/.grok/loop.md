# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 15:09 BST — Window-blur mid Shift-release after quiet Escape + keep-clear + Shift-held reuses the same mute helper so a stale caption cannot revive on focus return.

## Next recommended

Pointer-cancel mid that same muted keep-clear Shift-held path should reuse the window-blur mute helper so a cancelled scrub cannot flash the next-frame name.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur delegates to the Shift-release helper.
- Present chrome routes window blur through applyQuietKeepClearWindowBlur; Shift keyup still uses the Shift-release helper.
- Quiet Escape while Shift is held uses peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld and marks the keep-clear path.
- Naming an off-current tick on the blur path still lifts mute and shows that frame.
