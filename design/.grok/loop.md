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

1. Path simplify / corner radius on offset outlines.
2. Convert selected shape to editable path before offset.

## Done

- Outline stroke / offset path: selected contour becomes a new layer. Closed strokes fill with an even-odd hole; open strokes cap into a closed outline. Inspector + command palette. Zustand store restored (~29kb).
- Knife: click a path segment to cut. Closed contours open at the nick; open paths split into two layers. Phosphor crosshair preview. `K` selects the tool.
- Pen: double-click a corner to auto-smooth; snap two open path ends together to join (9px ring).
- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.

## Iterations

### 2026-09-01T08:20Z — loop 106

**Outline stroke as a new contour.** Select a path, then Outline stroke / Offset out / Offset in in the inspector (or the command palette). Stroke width drives the distance. Closed paths keep a hole so the outline is a filled ring; open paths get round caps. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-09-01T07:35Z — loop 105

**Knife lives on the artboard.** The scissors tool now cuts on pointer-down: hover draws a phosphor nick and slash; click runs `knifeCutAt` (rotated local space). Closed paths open; open paths split into two layers. Zustand store restored (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

## Next recommended

Path simplify / corner radius on offset outlines.
