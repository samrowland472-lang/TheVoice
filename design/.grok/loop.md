# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 11:20 BST — Layers drag-drop keeps parentId. Drop the grip on the middle of a group to nest (phosphor ring, Into). Drop on the edge to sit beside that row and inherit its parent. A group cannot be dropped into itself. Group / Ungroup sit under the filter; the list indents and collapses.

## Next recommended

Marquee-select that includes a group's children when the group box is hit, without selecting locked layers.

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
- Layers drag-drop that keeps parentId when dropping onto a group

## Backlog

- Marquee-select that includes a group's children when the group box is hit, without selecting locked layers
- Rename a group from the canvas selection label
- Export SVG that wraps groups in `<g>` tags
