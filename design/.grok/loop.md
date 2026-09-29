# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 04:10 BST — Export pipeline is whole again: raster PNG/JPEG, SVG with shared defs, print JPEG PDF, campaign stack SVG/PDF. placeNodes is typed. Isolate Show-all still restores from snapshot.

## Next recommended

Present peek chrome tests still expect older hairline class names. Path-edit mid-drag still uses the pointer-down snapshot.

## Done

- export.ts: rasterize, exportPng/Jpeg/Svg, collectSvgDefs, exportSvgBody, printJpegPage, downloadPrintPdf (real JPEG PDF, not PNG).
- buildJpegPdf wrapper keeps /Filter /DCTDecode contract.
- store-impl.placeNodes typed.
- applyIsolate restores snapshot before keepIds (prior).
