# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 13:05 BST — Tight-crop selection export. Crop PNG/SVG size the artboard to the selection AABB (2px pad), shift nodes onto that board, drop guides.

## Next recommended

Select one headline, Export → Crop PNG, and confirm the file is the layer box — not the full artboard. Compare with Selection PNG.

## Done

- cropSelectionDocument(doc, ids)
- Export menu: Crop PNG / Crop SVG (disabled with empty selection)
- selectionDocument still exports on the original artboard
- export-selection tests cover crop AABB + menu labels

## Backlog

- Isolate + export current isolate set
- Layer groups
- Shadow-aware crop pad
