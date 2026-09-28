# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 00:05 BST — Campaign PDF. Stacked campaign boards now export as a real multi-page PDF (one JPEG page per artboard, same order as Campaign SVG). Campaign SVG and Campaign PDF sit in Export when a set is linked. Single-board SVG lifts clips and shadows into defs so campaign prefixes stay unique.

## Next recommended

Path-edit mid-drag still uses the pointer-down snapshot — keep that contract if knife ever live-previews a cut. Print PDF for a single board still downloads a PNG; fold it onto the same JPEG-PDF writer.

## Done

- export.ts: collectSvgDefs + exportSvgBody; single-board SVG writes shared defs.
- export-campaign.ts: campaignStackLayout, campaignDocsFromIndex, exportCampaignSvg/Pdf, downloadCampaignSvg/Pdf.
- top-bar: Campaign SVG / Campaign PDF when doc.campaignId is set.
- knife-apply: snapshotPathNode at the start of applyCutsToPath, applyKnifeStrokeToPath, applyKnifePointToPath.
- clonePathStyle clones rings so extras cannot alias live holes.
- path-actions.knifeCutStroke plans all hits, commits once, then writes keep + extras.
- store-impl.placeNodes typed.
- path-edit.ts: clonePathPoint, snapshotPathNode.
