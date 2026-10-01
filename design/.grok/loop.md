# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-01 21:05 BST — Hidden groups still hoist (no group box) but opacity and blend ride the nest. A hidden group with opacity under 1 or a non-normal blend wraps its visible children in a `data-hoist` group that carries opacity and `isolation:isolate`. A fully opaque normal blend stays a bare hoist. The inspector says so on a hidden group, and the export note adds "hidden nest keeps opacity".

2026-10-01 17:05 BST — Group blend isolates the nest. A group's non-normal blend writes `isolation:isolate` on the wrapping `<g>` with the blend, so the nest flattens first and composites as one unit against the artboard. Opacity still rides the group. The inspector says so when the blend is not normal, and the export note adds "blend isolated".

2026-10-01 15:05 BST — Group opacity rides the SVG group. A group's opacity and blend sit on the wrapping `<g>`, so nested layers inherit them on export. Text, path, and shape layers still write their own opacity, wrapped or not. The inspector says so on a group, and the export note adds "opacity rides the group" when a group is not fully opaque or uses a blend.

2026-10-01 14:05 BST — SVG group wrappers. Export SVG nests each group in a `<g>` with its name, and nests groups inside groups. Children keep artboard coordinates. A hidden group does not paint a box; its visible layers still export. The export note counts wrapped groups.

2026-10-01 13:05 BST — Group name on the board. A selected group shows its name above the box; double-click the chip to type a new name. Enter keeps it, Esc leaves the old one. The pasteboard now fills the stage so clicks reach the canvas.

2026-10-01 12:05 BST — Layers drop polish. Illegal nests (a group into itself or a descendant) show a faint ring and No, and the drop is refused. Holding the grip on a collapsed group centre opens it so children can be targeted. The insert bar follows the row indent. While dragging, the panel says centre nests and the edge keeps that row's parent.

## Next recommended

Raster PNG still skips a hidden group's opacity, so a faded hidden group only shows in SVG. Apply the same hoist opacity on the canvas raster path.

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
- Group opacity and blend ride the SVG `<g>`; text and path keep their own opacity
- Group blend isolates the nest (`isolation:isolate`) so the blend composites the group as one unit
- Hidden groups hoist without a box; opacity and blend still wrap that nest

## Backlog

- Raster PNG still skips a hidden group's opacity (SVG hoist now keeps it)
