# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 14:05 BST — SVG group wrappers. Export SVG nests each group in a `<g>` with its name, and nests groups inside groups. Children keep artboard coordinates. A hidden group does not paint a box; its visible layers still export. The export note counts wrapped groups.

2026-10-01 13:05 BST — Group name on the board. A selected group shows its name above the box; double-click the chip to type a new name. Enter keeps it, Esc leaves the old one. The pasteboard now fills the stage so clicks reach the canvas.

2026-10-01 12:05 BST — Layers drop polish. Illegal nests (a group into itself or a descendant) show a faint ring and No, and the drop is refused. Holding the grip on a collapsed group centre opens it so children can be targeted. The insert bar follows the row indent. While dragging, the panel says centre nests and the edge keeps that row's parent.

## Next recommended

Group opacity and blend ride the SVG `<g>` so nested layers inherit them on export.

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
- Drop polish: No on illegal nests, dwell-open collapsed groups, indented insert bar
- Marquee-select includes a group's children when the group box is hit, skips locked
- Rename a group from the canvas selection label
- Pasteboard fills the stage (canvas hit target)
- Export SVG wraps groups in `<g>` tags (nested, named, no group rect)

## Backlog

- Group opacity and blend ride the SVG `<g>` so nested layers inherit them on export
- SVG text and path layers keep their own opacity when a group is not wrapping them
