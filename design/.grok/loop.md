# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 13:05 BST — Shift-release after quiet Escape + keep-clear + Shift-held stays muted until an off-current tick is named; next-frame fallback does not flash.

## Next recommended

Window-blur mid Shift-release after that quiet Escape path should reuse the same mute helper so a stale caption cannot revive on focus return.

## Done

- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease stays muted with a null captionId when no off-current tick is named.
- Naming an off-current tick on that path lifts mute and shows that frame.
- Present chrome routes Shift-held Escape through the ShiftHeld helper and Shift-release while muted through the ShiftRelease helper.
- Quiet Escape after keep-clear while Shift is held uses peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld; keep is forced dead so later current-dot hover names the live frame.
