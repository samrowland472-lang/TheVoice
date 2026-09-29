# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 23:15 BST — Peek tick remaining now pauses across a campaign wrap while speaker notes stay open (`peekTickDwellAcrossWrap`). Present `go()` walks `campaignStackNeighbor` so last→first / first→last. Peek strip remounted on the hidden rail: phosphor ticks, named caption locked to `tickRemaining`, double-click notes, PDF from the peek chip. Broken `esc()` in export.ts repaired.

## Next recommended

Smoke raster page-count against a three-board campaign fixture. Resume the tick clock the moment peek notes close after a wrap.

## Done

- peekTickDwellAcrossWrap keeps dwell when notesVisible && wrapped.
- campaignStackNeighbor drives Present go(); ArrowUp/Down flip the stack.
- Peek strip: data-present-peek, scrub, data-peek-tick, phosphor ticks.
- peekTickOpacity(Math.abs(n - i), tickRemaining) + dwell clock paused while notes visible.
- peekCaptionVisible / peekCaptionOpacity(tickRemaining).
- PresentNotesPanel on notesVisible (rail or peek double-click).
- exportPeekCampaignPdf → downloadCampaignPdf while showPeek.
- Fixed broken esc() in export.ts.
