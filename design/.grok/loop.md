# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 05:01 BST — Browser smoke rasters a three-board campaign PDF and asserts `/Type /Page` count is 3 (not `/Type /Pages`). `countPdfTypePageObjects` + `exportCampaignPdf(docs, scale)` share stack order with Present. Present chrome can download the campaign PDF from the peek rail.

## Next recommended

Wire peek dwell remaining into Present caption fade instead of the constant tickRemaining used for the caption visibility check.

## Done

- countPdfTypePageObjects ignores `/Type /Pages`.
- rasterThreeBoardCampaignPdf + window.__voiceDesignCampaignPdfSmoke.
- browser-smoke desktop probe: expected === typePages === 3.
- downloadCampaignPdf honors scale; Present Campaign PDF control.
- esc() SVG entities restored; placeNodes typed; missing peek helpers exported.
