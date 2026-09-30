# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 00:29 BST — Layers tree indent + twist. Groups nest under their parent with a phosphor chevron; collapse hides children. Group / Ungroup sit above the list (also Cmd+G / Cmd+Shift+G). Store now wires groupSelection, ungroupSelection, and cascade patches.

## Next recommended

Multi-select rotate around shared centre.

## Done

- isolateDocument / cropIsolateDocument
- Export menu: Isolate PNG / SVG / crop variants
- shadowCropExtents + cropSelectionDocument pad
- shadow-crop-pad tests
- Layer groups: parentId + group kind, group/ungroup store actions, layers tree, Cmd+G
- Nested groups + reorder as a unit in the Layers list
- Group transform handles (one AABB, resize + move descendants)
- Group rotate handle (one angle for the nest)
- Layers tree indent + collapse twist + Group/Ungroup chrome

## Backlog

- Multi-select rotate around shared centre
- Layers drag-drop that keeps parentId when dropping onto a group
