# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 11:05 BST — Layers Alt-click lock now locks every other layer (same keep-set toggle as isolate). Unlock all restores the lock snapshot. `applyLockOthers` reuses isolate by treating unlocked as visible.

## Next recommended

Alt-click a layer lock in a multi-layer board, drag the unlocked piece, then Unlock all and confirm the other locks restore.

## Done

- applyLockOthers + lockSnapshot on the design store.
- Layers lock button: Alt-click lock-others; Unlock all rail.
- Isolate Show all unchanged.
- pdfTypePageCount / pdfPagesCountField on JPEG PDFs.
- threeBoardCampaignFixture + probeRasterCampaignPdf.
- installCampaignPdfSmokeHook on PreviewHostBridge (dynamic import).
- browser-smoke desktop evaluate: typePage === 3, countField === 3, %PDF header.
- esc() SVG entities restored; present-idle peek helpers typed for typecheck.
- placeNodes place records typed.
- shouldRestoreNotesCaretAfterFrameJump after wrap / frame change.
- persistNotesCaret before go/goTo; restoreNotesCaret + restoreCaretIfFocused on land.
- PresentNotesPanel mounted; N / Escape still toggle and close.
- campaignStackAdvance + peekWrapPendingAfterAdvance in PresentView.go.
- Peek dots: data-present-peek, double-click opens peek notes, wrap keys ArrowUp/Down.
- peekTickDwellAfterNotesClose exported from present-idle.
