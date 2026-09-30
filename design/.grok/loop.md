# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 15:05 BST — Isolate export. Export menu ships Isolate PNG/SVG and Isolate crop PNG/SVG from the current isolate set (visible layers), disabled when isolation is off.

## Next recommended

Alt-click a layer to isolate, Export → Isolate PNG (full artboard, hidden layers dropped) then Isolate crop PNG (tight AABB). Compare with Selection PNG.

## Done

- isolateDocument / cropIsolateDocument
- Export menu: Isolate PNG / SVG / crop variants (disabled without isolateSnapshot)
- selection + crop export unchanged
- export-selection tests cover isolate names and menu labels

## Backlog

- Layer groups
- Shadow-aware crop pad
