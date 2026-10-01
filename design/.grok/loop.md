# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 05:10 BST — Multi-select rotate around the shared AABB centre. The cyan stem above the selection box turns the whole pick as one: each layer keeps its own rotation and orbits the shared midpoint. Shift snaps to 15°. Groups still rotate as a nest.

## Next recommended

Layers drag-drop that keeps parentId when dropping onto a group.

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
- Multi-select rotate around shared centre

## Backlog

- Layers drag-drop that keeps parentId when dropping onto a group
