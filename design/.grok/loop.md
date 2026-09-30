# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 04:05 BST — Present wrap now drives `go()` via `campaignStackAdvance` (ArrowUp/Down last→first). Speaker notes persist the caret before a jump and restore it on the landed frame when notes stay open. Peek dwell keeps remaining across a notes-open wrap. Notes drawer is back on the present stage. `esc()` writes safe SVG entities again.

## Next recommended

Raster a three-board campaign PDF in the browser smoke and assert `/Type /Page` count.

## Done

- shouldRestoreNotesCaretAfterFrameJump after wrap / frame change.
- persistNotesCaret before go/goTo; restoreNotesCaret + restoreCaretIfFocused on land.
- PresentNotesPanel mounted; N / Escape still toggle and close.
- campaignStackAdvance + peekWrapPendingAfterAdvance in PresentView.go.
- Peek dots: data-present-peek, double-click opens peek notes, wrap keys ArrowUp/Down.
- peekTickDwellAfterNotesClose exported from present-idle.
- placeNodes typed; esc() entities in export.ts.
