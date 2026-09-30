# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 00:20 BST — Layers tree. Groups indent under their parent with a phosphor twist to collapse the nest. Cmd+G / Cmd+Shift+G group and ungroup; the panel grows matching buttons when the selection allows it. Hide/lock on a group still walks descendants.

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
- Layers tree indent + collapse twist

## Backlog

- Multi-select rotate around shared centre
- Reparent by dropping onto a group row
