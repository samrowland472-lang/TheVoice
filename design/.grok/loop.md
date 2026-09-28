# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-28 10:14 BST — Store actions restored (commit, undo/redo, updateNodes, replaceNode, placeNodes, translateSelected, guides, clipboard). Phosphor crop pins draw on a selected photo or paint layer. Drag a pin to crop against the frozen source box. Alt+arrows nudge a crop edge; campaign page swap still uses Alt+left/right when no bitmap is selected.

## Next recommended

Paint bitmap baking when the layer is resized. Campaign multi-page SVG that shares the same clip def set across boards. Inspector Photo section for paint as well as images.

## Done

- Store-impl: history, node edits, campaign pages, placeNodes, crop-safe replaceNode.
- Canvas select tool draws crop pins and drags applyCropHandle on image + paint.
- Alt+arrows crop selected bitmaps; otherwise campaign nudge.
