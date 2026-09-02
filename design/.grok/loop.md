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

1. Align / distribute with rotation-aware island boxes.
2. Knife live preview along the whole stroke, not only the pointer tip.

## Done

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

### 2026-09-02T12:20Z — loop 127

**Knife on self-overlapping traces.** Figure-eight and bowtie contours split into simple lobes before a knife cut. Drag with K across one lobe: that ring opens, the other lobe stays a closed sibling. Hover snap and the cut stroke both use the planarized rings.

### 2026-09-02T11:20Z — loop 126

**Align / distribute across compound islands.** A path that still holds several disjoint outers (union leftovers, unsplit type) splits those islands on align or distribute. First island keeps the original id; extras become sibling path layers. Holes stay on their parent. Inspector treats island count as the selection size for Align-to-selection and Distribute.

### 2026-09-02T08:28Z — loop 125

**Winding pass on self-overlapping traces.** Figure-eight and bowtie contours are split into simple lobes before union/subtract/intersect/exclude.

### 2026-09-02T08:20Z — loop 124

**Align / distribute on converted path islands.** Type converted to paths now tightens each glyph onto its contour.

### 2026-09-02T07:30Z — loop 123

**Boolean apply keeps islands inside punched holes.**

## Next recommended

Align / distribute with rotation-aware island boxes.
