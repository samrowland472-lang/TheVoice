# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 00:25 BST — Print PDF is a real JPEG PDF. Single-board Export → Print PDF writes a one-page PDF (crop marks, 4× JPEG, /DCTDecode). Campaign PDF uses the same writer so stacked boards stay one page each. Campaign SVG prefixes clips and shadows in a shared defs block.

## Next recommended

Path-edit mid-drag still uses the pointer-down snapshot — keep that contract if knife ever live-previews a cut. Present mode could flip campaign boards with the same stack order as the PDF.

## Done

- export.ts: collectSvgDefs + exportSvgBody; single-board SVG writes shared defs.
- export.ts: buildJpegPdf, printJpegPage, downloadPrintPdf → .pdf not .png.
- export-campaign.ts: campaignStackLayout, campaignDocsFromIndex, exportCampaignSvg/Pdf, downloadCampaignSvg/Pdf.
- top-bar: Campaign SVG / Campaign PDF when doc.campaignId is set; Print PDF uses JPEG PDF.
- knife-apply: snapshotPathNode at the start of applyCutsToPath, applyKnifeStrokeToPath, applyKnifePointToPath.
- clonePathStyle clones rings so extras cannot alias live holes.
- path-actions.knifeCutStroke plans all hits, commits once, then writes keep + extras.
- store-impl.placeNodes typed.
- path-edit.ts: clonePathPoint, snapshotPathNode.
