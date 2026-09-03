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

1. Align preview: while hovering an Align edge, ghost the movers against the key frame before commit.
2. Distribute relative to the key object (keep key fixed, space the rest).

## Done

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

### 2026-09-03T07:30Z — loop 138

**Key frame while aligning.** Shift-select two or more layers, Inspector Align → Key: the last-selected layer draws a dashed phosphor frame with a top-edge tick. Hover Left/Right/Top/Bottom to light the snap side; press an edge to snap others to that box. Click Key on another selected layer in the stack to promote it without reordering.

### 2026-09-03T06:25Z — loop 137

**Key frame on the artboard.** Shift-select two layers, Inspector Align → Key: the last-selected layer's oriented box draws on the board (dashed phosphor, tick on the top edge). Edges snap others to that frame; the key stays put. Selection and Artboard targets stay available.

### 2026-09-03T03:20Z — loop 136

**Key mark in layers.** Shift-select two layers: the last one shows KEY in the stack. Inspector Align → Key, then an edge: others snap to that layer's oriented box; the key stays put. Store is typed so typecheck sees real document nodes.

### 2026-09-03T01:28Z — loop 135

**Align to key object.** Shift-select two or more layers, set Align to Key, then press an edge. Layers snap to the last-selected layer's oriented box; that key stays put. Selection still uses the union of frames; Artboard still uses the page.

### 2026-09-03T01:25Z — loop 134

**Knife preview on one bowtie lobe.** Drag K across a single ring of a figure-eight: only that lobe lights and only its crossings mark. The other ring stays quiet until the stroke actually crosses it. Apply uses the same planar cut.

### 2026-09-03T00:20Z — loop 132

**Knife apply on one figure-eight lobe.** Release a K stroke that only crosses one bowtie ring: that lobe opens into an open path, the other lobe stays a closed sibling layer. Click-cut does the same. Preview already used planarized rings; apply now matches.

### 2026-09-02T23:40Z — loop 131

**Align-to-selection uses oriented frames.** The target box is the union of each layer's rotated frame projection (`unionOrientedBox`), matching how each layer already moves. A diamond and a square now share a selection edge that follows those frames, not the fat ink AABB.

### 2026-09-02T23:25Z — loop 130

**Oriented boxes for align / distribute.** Paths tighten onto a min-area OBB (rotation + local frame). Align and distribute measure the projection of that rotated frame, not the raw ink AABB. Converted type and exploded compounds pick up the same frame.

### 2026-09-02T22:25Z — loop 129

**Knife preview along the whole stroke.** Drag with K and the dashed cut line shows every intersection on the path before release. Hover still snaps to the nearest segment; release applies `knifeCutStroke`.

### 2026-09-02T21:20Z — loop 128

**Rotation-aware island boxes.** Align and distribute flatten a path's rotation into its points, then tighten and explode islands on those world-space boxes. A rotated compound of two marks now spaces by ink, not by the unrotated frame.

### 2026-09-02T12:20Z — loop 127

**Knife on self-overlapping traces.** Figure-eight and bowtie contours split into simple lobes before a knife cut. Drag with K across one lobe: that ring opens, the other lobe stays a closed sibling. Hover snap and the cut stroke both use the planarized rings.

### 2026-09-02T11:20Z — loop 126

**Align / distribute across compound islands.** A path that still holds several disjoint outers (union leftovers, unsplit type) splits those islands on align or distribute. First island keeps the original id; extras become sibling path layers. Holes stay on their parent. Inspector treats island count as the selection size for Align-to-selection and Distribute.

### 2026-09-02T08:28Z — loop 125

**Winding pass on self-overlapping traces.** Figure-eight and bowtie traces are split into simple lobes before union/subtract/intersect/exclude.

### 2026-09-02T08:20Z — loop 124

**Align / distribute on converted path islands.** Type converted to paths now tightens each glyph onto their contour.

### 2026-09-02T07:30Z — loop 123

**Boolean apply keeps islands inside punched holes.**

## Next recommended

Ghost movers against the key frame while an Align edge is hovered, so the result is visible before commit.
