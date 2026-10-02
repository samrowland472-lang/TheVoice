# The Voice Design — 100-hour improvement loop

## Iteration

2026-10-02 15:05 BST — Keyboard nest nudge snaps to guides. Arrow keys still step 1 px, Shift 10 px, Alt 0.5 px. With snap on, a step that lands within the drag threshold pulls the nest onto the artboard, a sibling, or a ruler guide and lights that phosphor line while the arrow is held. Alt bypasses the snap. A nest already on the line steps off so the guide does not trap it. The status strip says snapped to guide.

2026-10-02 14:02 BST — Keyboard nudge moves a selected group as one nest. Arrow keys still step 1 px, Shift 10 px, Alt 0.5 px. A lone group selection shifts the group and its children together (locked groups stay put). A phosphor tick leaves the nest centre with the step, and the status strip says the direction with group moved as one. Mixed selections still expand like a drag.

2026-10-02 07:01 BST — Corner readout sits beside the dragged handle. North-west, north-east, south-east, and south-west still pin the opposite corner (Shift locks aspect). While the handle is held, a phosphor tick runs out from that corner and reads width and height percent. The nest still shows the pair above the box, the opposite corner still lights, and the status strip says width and height with the opposite corner pinned.

2026-10-02 06:05 BST — Corner handles pin the opposite corner. North-west, north-east, south-east, and south-west handles still scale the spun nest (Shift locks aspect). After the nest scales, the group and its children shift so the opposite corner stays on the same world point under the group angle. That corner lights as a diamond while the handle is held, and the status strip says the scale with opposite corner pinned.

2026-10-02 02:10 BST — Edge handles pin the opposite side. North, east, south, and west handles on a group scale one local axis (Shift does not open the other axis). After the nest scales, the group and its children shift so the opposite edge's midpoint stays on the same world point under the group angle. The pinned edge lights while the handle is held, and the status strip says the axis percent with opposite edge pinned.

2026-10-02 01:01 BST — Spun-frame resize without shear. Corner and edge handles still unspin into the nest frame, then scale children there. A rotated leaf is refit to a rectangle (edge lengths follow the scaled axes, angle follows the width edge) so the nest does not skew. The group box is synced to the union before the drag so the paint centre matches the frame. While a handle is held, the percent sits beside the box and in the status strip. Shift still locks aspect.

2026-10-02 00:15 BST — Spun frame for the group ring. The box, corner handles, and rotate ring now turn with the group's angle about the nest centre, matching the board, PNG, and SVG. Dragging the ring still only adds to that angle. While the ring is held, the degree sits beside it and in the status strip. Shift still snaps to 15°.

2026-10-02 00:10 BST — Board rotate handle. Selecting a group draws one box with a ring above the nest. Dragging the ring adds only to the group's angle (Shift snaps to 15°), so the nest turns about the group centre on the board the same way PNG and SVG already do. Corner handles scale that nest. A selection that is not a group uses the same handles around the shared box. The group name chip is back on the board.

2026-10-01 23:05 BST — Group rotation rides the nest. A group's angle turns its children about the group centre on the board, in PNG, and on the SVG `<g>`. Hidden groups still hoist with no box, and a rotated hoist keeps that turn. Leaves keep their own rotation. The inspector says so, and the export note adds "rotation rides the group".

2026-10-01 22:05 BST — Hidden group opacity rides the canvas and PNG. A hidden group still paints no box; its visible children stay on the board and inherit the group's opacity. A non-normal blend isolates that nest offscreen, then composites it as one unit, same as SVG. Hide no longer forces children off, so the hoist is what you see.

2026-10-01 21:05 BST — Hidden groups still hoist (no group box) but opacity and blend ride the nest. A hidden group with opacity under 1 or a non-normal blend wraps its visible children in a `data-hoist` group that carries opacity and `isolation:isolate`. A fully opaque normal blend stays a bare hoist. The inspector says so on a hidden group, and the export note adds "hidden nest keeps opacity".

2026-10-01 17:05 BST — Group blend isolates the nest. A group's non-normal blend writes `isolation:isolate` on the wrapping `<g>` with the blend, so the nest flattens first and composites as one unit against the artboard. Opacity still rides the group. The inspector says so when the blend is not normal, and the export note adds "blend isolated".

2026-10-01 15:05 BST — Group opacity rides the SVG group. A group's opacity and blend sit on the wrapping `<g>`, so nested layers inherit them on export. Text, path, and shape layers still write their own opacity, wrapped or not. The inspector says so on a group, and the export note adds "opacity rides the group" when a group is not fully opaque or uses a blend.

2026-10-01 14:05 BST — SVG group wrappers. Export SVG nests each group in a `<g>` with its name, and nests groups inside groups. Children keep artboard coordinates. A hidden group does not paint a box; its visible layers still export. The export note counts wrapped groups.

2026-10-01 13:05 BST — Group name on the board. A selected group shows its name above the box; double-click the chip to type a new name. Enter keeps it, Esc leaves the old one. The pasteboard now fills the stage so clicks reach the canvas.

2026-10-01 12:05 BST — Layers drop polish. Illegal nests (a group into itself or a descendant) show a faint ring and No, and the drop is refused. Holding the grip on a collapsed group centre opens it so children can be targeted. The insert bar follows the row indent. While dragging, the panel says centre nests and the edge keeps that row's parent.

## Next recommended

Name the equal-gap spacing tick in the status strip when a keyboard snap lands on a matched gap, and keep that tick lit with the guide while the arrow is held.


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
- Raster PNG and the board apply the same hidden-group opacity and isolated blend
- Group rotation rides the nest on the board, PNG, and SVG `<g>` (hidden hoist included)
- Board rotate handle wired to rotateGroupNodes; resize handles scale the nest via scaleGroupNodes
- Rotate ring and corner handles sit on the spun nest frame; live degree beside the ring
- Group name chip mounted on the stage again
- Spun-frame resize refits rotated leaves so the nest does not shear; live percent beside the box
- Edge handles scale one local axis and pin the opposite edge in world space; pinned edge lights while held
- Corner handles pin the opposite corner in world space; pinned corner lights while held
- Live width and height percent beside the dragged corner handle
- Keyboard nudge moves a selected group and its children as one nest; tick and status read the step
- Keyboard nest nudge snaps to guides (Alt bypasses) and lights the guide while held

## Backlog

- Name the equal-gap spacing tick in the status strip when a keyboard snap lands on a matched gap
