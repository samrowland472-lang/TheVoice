# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 05:20 BST — Browser smoke rasters a three-board campaign PDF and asserts `/Type /Page` plus `/Count`. `pdfTypePageCount` ignores the `/Pages` tree. Hub installs the probe hook lazily so canvas export stays off SSR.

## Next recommended

Export Campaign PDF from the top bar for a live three-board campaign and confirm the downloaded file opens as three pages.

## Done

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
