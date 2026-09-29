# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 18:10 BST — Present wraps the campaign stack (ArrowUp/Down). Peek rail returns with phosphor ticks fading on tickRemaining; named caption uses peekCaptionOpacity. PDF on the peek strip downloads the JPEG campaign PDF while the chrome rail is hidden. Double-click peek opens notes; Escape stays quiet.

## Next recommended

Campaign PDF page-count smoke against printJpegPage order. Peek caption hide when remaining hits 0 without leaving a ghost name.

## Done

- campaignStackNeighbor drives Present go(); wrap last→first.
- Peek strip remounted: data-present-peek, scrub, data-peek-tick, phosphor ticks.
- peekTickOpacity(Math.abs(n - i), tickRemaining) + dwell clock paused while notes visible.
- peekCaptionOpacity(tickRemaining) locks the named caption fade to the tick clock.
- PresentNotesPanel on notesVisible (rail or peek double-click).
- exportPeekCampaignPdf → downloadCampaignPdf while showPeek.
- Fixed broken esc() in export.ts; typed placeNodes.
