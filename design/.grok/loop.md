# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-24 12:10 BST — Quiet Escape after keep-clear while Shift is held stays in present; later current-dot hover names the live frame and mutedPointerUpKeep stays dead.

## Next recommended

Shift-release after quiet Escape + keep-clear + Shift-held should stay muted until an off-current tick is named, without flashing the next-frame fallback.

## Done

- Quiet Escape after keep-clear while Shift is held uses peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld; keep is forced dead so later current-dot hover names the live frame.
- peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldCurrentHover composes that path with current-dot hover.
- Present chrome routes Shift-held Escape through the ShiftHeld helper and stays in present.
