# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 00:20 BST — Peek tick clock resumes when speaker notes close after a campaign wrap (`peekTickDwellAfterNotesClose`). Present `go()` wraps with `campaignStackNeighbor` (ArrowUp/Down too). Campaign PDF page count is board count (three-board fixture, no raster). Peek strip remounted with phosphor ticks, named caption on `tickRemaining`, double-click notes, PDF chip.

## Next recommended

Raster a three-board campaign PDF in the browser smoke and assert `/Type /Page` count. Keep wrap-pending only until the next non-wrap advance.

## Done

- peekTickDwellAfterNotesClose resumes remaining when notes close after wrap.
- peekTickDwellAcrossWrap keeps dwell when notesVisible && wrapped.
- campaignStackNeighbor drives Present go(); ArrowUp/Down flip the stack.
- Peek strip: data-present-peek, scrub, data-peek-tick, phosphor ticks.
- peekTickOpacity(Math.abs(n - i), tickRemaining) + dwell clock paused while notes visible.
- peekCaptionVisible / peekCaptionOpacity(tickRemaining).
- PresentNotesPanel on notesVisible (rail or peek double-click).
- exportPeekCampaignPdf → downloadCampaignPdf while showPeek.
- Fixed broken esc() in export.ts.
