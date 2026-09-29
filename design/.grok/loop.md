# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 22:10 BST — Peek strip remounted with phosphor ticks. Named caption uses peekCaptionOpacity(tickRemaining) and peekCaptionVisible so remaining 0 leaves no ghost name. Campaign PDF page count walks printJpegPage order (campaignPdfPages). Present go() wraps via campaignStackNeighbor; ArrowUp/Down flip the stack. Peek PDF downloads while the rail is hidden.

## Next recommended

Smoke raster page-count against a three-board campaign fixture. Pause tick remaining when peek notes stay open across a wrap.

## Done

- peekCaptionVisible hides the named caption at remaining 0.
- campaignPdfPages / campaignPdfPageCount share printJpegPage order with Present.
- campaignStackNeighbor drives Present go(); wrap last→first.
- Peek strip remounted: data-present-peek, scrub, data-peek-tick, phosphor ticks.
- peekTickOpacity(Math.abs(n - i), tickRemaining) + dwell clock paused while notes visible.
- peekCaptionOpacity(tickRemaining) locks the named caption fade to the tick clock.
- PresentNotesPanel on notesVisible (rail or peek double-click).
- exportPeekCampaignPdf → downloadCampaignPdf while showPeek.
- Restored present-idle helpers (lost-capture, Home/End mute, quiet Escape).
- Fixed broken esc() in export.ts; typed placeNodes.
