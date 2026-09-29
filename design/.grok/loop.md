# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 01:10 BST — Present flips campaign boards in the same stack order as Campaign PDF. Arrow Down/Right and click wrap last → first; Arrow Up/Left wrap first → last. Restored JPEG Print PDF + shared SVG defs after a truncated export.ts.

## Next recommended

Path-edit mid-drag still uses the pointer-down snapshot — keep that contract if knife ever live-previews a cut. Present peek chrome tests still expect older hairline class names.

## Done

- campaign.ts: campaignStackIndex + campaignStackNeighbor wrap the campaignPages order used by PDF.
- present-chrome: Prev/Next and arrows walk that stack and wrap.
- present-idle: ArrowUp/ArrowDown stay quiet like Left/Right.
- export.ts restored: collectSvgDefs, exportSvgBody, printJpegPage, downloadPrintPdf (real .pdf).
- store-impl.placeNodes typed.
