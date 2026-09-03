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

1. Align preview against Selection and Artboard targets the same way Key already ghosts movers.
2. Distribute preview marks the key pin so the reserved slot is obvious.

## Done

- Distribute with Align set to Key keeps the key layer fixed and spaces the rest evenly around it.
- Hovering Horizontal / Vertical ghosts the movers before commit.
- Hovering an Align edge ghosts the other selected frames against the key box before commit.
- Align Key target is wired: last-selected layer is the snap box; that key stays put.
- Key oriented frame draws on the artboard (dashed phosphor + top tick); hovering an edge lights that side of the frame.
- Layers Key badge click promotes another selected layer to key without changing stack order.

- Align set to Key draws that last-selected layer's rotated frame on the artboard (dashed phosphor box + top-edge mark) so the snap target is visible before an edge is pressed.
- Layers list marks the last-selected layer as Key when two or more are selected; Align offers a Key target that uses that layer's oriented box.

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

### 2026-09-03T07:50Z — loop 140

**Distribute around the key.** Shift-select three or more layers, Align → Key. Hover Horizontal or Vertical: movers ghost into even gaps while the key frame stays put. Click to commit. Selection / Artboard distribute still spans first-to-last as before.

### 2026-09-03T07:45Z — loop 139

**Ghost movers on Align hover.** Shift-select two or more layers, Align → Key. The key frame is dashed on the board. Hover Left/Top/Right/Bottom: that edge lights and the other layers draw faint frames where they will land. Click to commit; the key stays put. Faint Key in Layers promotes another selected layer.

### 2026-09-03T07:30Z — loop 138

**Key frame while aligning.** Shift-select two or more layers, Inspector Align → Key: the last-selected layer draws a dashed phosphor frame with a top-edge tick. Hover Left/Right/Top/Bottom to light the snap side; press an edge to snap others to that box. Click Key on another selected layer in the stack to promote it without reordering.

### 2026-09-03T06:25Z — loop 137

**Key frame on the artboard.** Shift-select two layers, Inspector Align → Key: the last-selected layer's oriented box draws on the board (dashed phosphor, tick on the top edge). Edges snap others to that frame; the key stays put. Selection and Artboard targets stay available.

## Next recommended

Ghost Align movers against Selection and Artboard targets the same way Key already does.
