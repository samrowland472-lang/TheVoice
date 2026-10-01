# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 11:30 BST — Marquee through a group box now selects the group and its unlocked, visible children. Locked layers stay out of the pick. Shift-marquee still adds.

## Next recommended

Rename a group from the canvas selection label.

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
- Marquee-select includes a group's children when the group box is hit, skips locked

## Backlog

- Rename a group from the canvas selection label
- Export SVG that wraps groups in `<g>` tags
