# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 17:05 BST — Shadow-aware crop. Crop PNG/SVG and Isolate crop grow the artboard by drop-shadow halo (blur + spread + offset). Inset shadows do not pad.

## Next recommended

Drop a rectangle, add a drop shadow with large oy/blur, Export → Crop PNG. Shadow should stay inside the file. Switch to inset — crop stays tight.

## Done

- isolateDocument / cropIsolateDocument
- Export menu: Isolate PNG / SVG / crop variants
- shadowCropExtents + cropSelectionDocument pad
- shadow-crop-pad tests

## Backlog

- Layer groups
