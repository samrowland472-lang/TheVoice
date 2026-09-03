# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`.
If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`types.ts` / `store.ts` / `render.ts` / `canvas-stage.tsx` / `export.ts` must be KB, not 11 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Backlog (priority order)

1. Inspector mixed blend/shadow write-through on multi-select.

## Done

- Marquee contain-mode: hold Alt while dragging the V-tool box to select only layers fully inside; default still intersects; live frames mark hits; contain draws corner ticks.
- Marquee select on the pasteboard: V tool drag on empty board draws a phosphor rect and selects intersecting unlocked layers; Shift adds; click empty clears; click a layer still moves with smart-guides.
- Inspector multi-select mixed fill/stroke: Selection panel writes fill, stroke, width, and opacity across every selected layer; chips unify to a layer's value.
- Smart-guides while dragging: live edge/center snaps against neighbors and the artboard.
- Align center/middle hover draws a phosphor axis through the snap box; movers still ghost.
- Align hover ghosts movers for Selection and Artboard, not only Key.
- Distribute hover ghosts landing frames; Key target pins the reserved slot.
- Store wires `previewAlignNodes`, `alignTarget`, and `distributeNodes(..., keyId)`.
- Distribute with Align set to Key keeps the key layer fixed and spaces the rest evenly around it.
- Hovering Horizontal / Vertical ghosts the movers before commit.
- Hovering an Align edge ghosts the other selected frames against the key box before commit.
- Align Key target is wired: last-selected layer is the snap box; that key stays put.
- Key oriented frame draws on the artboard (dashed phosphor + top tick); hovering an edge lights that side of the frame.
- Layers Key badge click promotes another selected layer to key without changing stack order.
- Align set to Key draws that last-selected layer's rotated frame on the artboard (dashed phosphor box + top-edge mark) so the snap target is visible before an edge is pressed.
- Layers list marks the last-selected layer as Key when two or more layers are selected; Align offers a Key target that uses that layer's oriented box.
- Align to a key object uses the last-selected layer's oriented frame; Selection and Artboard targets stay available.
- Knife live preview outlines only the planar lobe a stroke will open; untouched bowtie rings stay unmarked.
- Knife apply planarizes figure-eight / bowtie traces and cuts only the crossed lobe; the other lobe stays a closed sibling.
- Store is typed (`DesignStore`) so typecheck can see real document nodes instead of `any`.
- Align-to-selection target uses the union of oriented frames, not the sample AABB.
- Align / distribute rebase path islands onto a minimum-area oriented frame, then space by that rotated box's projection.
- Knife live preview draws the full stroke and a mark at every crossing, not only the pointer tip.
- Align / distribute bake rotated path islands into world-space ink boxes before explode.
- Knife planarizes figure-eight / bowtie traces into simple lobes before the cut, and the K tool now draws and applies the stroke on the artboard.
- Align / distribute explode disjoint islands that still live on one compound path (sibling rings stored as holes) into separate layers, then space by ink boxes.
- Store align/distribute now call `alignNodes` / `distributeNodes` instead of the node frame stub.
- Inspector counts islands, so one selected compound of three glyphs still offers Distribute.
- Figure-eight / bowtie traces run a winding pass before boolean clip.
- Align and distribute use each layer's geometry box.
- Distribute actually runs: three-plus selected layers even out horizontal or vertical gaps.
- Boolean apply keeps hole ownership on 3+ mixed compounds.
- Hover boolean ghosts draw every resulting compound, including nested islands.
- Knife live preview on the artboard (K).

## Iterations

### 2026-09-03T22:20Z — loop 147

**Marquee contain vs intersect.** V tool: drag empty board to marquee as before. Hold Alt while dragging — the box tightens (corner ticks) and only fully enclosed unlocked layers join the selection. Release Alt mid-drag to go back to intersect. Shift still adds. Live phosphor frames preview which layers will hit.
