# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 03:25 BST — Restored the truncated export pipeline so PNG, JPEG, SVG, Print PDF and campaign stack export compile again. Show all now restores isolate even with an empty keep set. placeNodes is typed.

## Next recommended

Path-edit mid-drag still uses the pointer-down snapshot — keep that contract if knife ever live-previews a cut. Present peek chrome tests still expect older hairline class names.

## Done

- export.ts restored: rasterize, exportPng/Jpeg/Svg, printJpegPage, downloadPrintPdf, collectSvgDefs, exportSvgBody.
- applyIsolate restores from snapshot before requiring keepIds.
- Layers Show all calls toggleIsolate([]).
- store-impl.placeNodes typed.
- layers isolate Alt-click eye (prior).
