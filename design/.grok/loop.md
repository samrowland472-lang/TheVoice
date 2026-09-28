# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 21:08 BST — Campaign multi-page SVG. A campaign with two or more boards grows an Export → Campaign SVG action. One file stacks the boards, and every text clip plus drop-shadow filter lives in a single shared `<defs>` set (ids prefixed per page so copies do not collide). Single-board SVG uses the same defs lift.

## Next recommended

Path-edit undo that snapshots points, not only node boxes. Campaign PDF that reuses the same stacked board walk.

## Done

- export.ts: collectSvgDefs, svgShadowDefs, exportSvgBody, exportCampaignSvg, downloadCampaignSvg.
- Single-board exportSvg writes `<defs>` then body (clips no longer inlined next to each `<text>`).
- Top bar: Campaign SVG when the open document has sibling campaign pages.
- box-resize.ts: hitResizeHandle, resizeBox, mapNodeToBox.
- canvas-stage: select-tool handles, mid-drag mapNodes from pointer-down snapshot.
- paint-bake.ts: paintBakeSize, paintNeedsBake, bakePaintNode, bakePaintIfSized.
- Store history, campaign pages, placeNodes, clipboard, print bleed restored.
- render.drawBitmapNode uses cropSourceRect + cssFilterStyle.
