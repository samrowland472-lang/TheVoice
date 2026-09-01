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

1. Convert text outlines to editable paths.
2. Real polygon clipper for boolean union/intersect (hull is still an approximation).

## Done

- Boolean union no longer treats other solids as holes; nested offset rings stay nested (containment is not hulled). Hole windings opposite the outer.
- Zustand store restored (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.
- Boolean preview keeps offset/outline holes: nested rings are not convex-hulled together; subtract punches the cutter and fills islands from cutter holes; windings oriented for evenodd.
- Convert selected shape (rect, ellipse, line, polygon, star, arrow) to an editable path. Offset / outline auto-convert first. Inspector Path row + command palette.
- Offset outlines fillet sharp corners, then Douglas–Peucker simplify. Inspector Offset row: Outline stroke, Round corners, Offset out/in, Simplify.
- Outline stroke / offset path: selected contour becomes a new layer.
- Knife: click a path segment to cut.
- Pen: double-click a corner to auto-smooth; snap two open path ends together to join.
- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.

## Iterations

### 2026-09-01T10:32Z — loop 110

**Boolean hole polish + store restore.** Nested offset rings that sit inside each other no longer collapse into one hull. Union keeps a combined outer and only the holes that still sit inside it; intersect keeps the smaller outer and interior holes. Hole windings flip opposite the outer for evenodd. Restored the truncated Zustand store (~29kb) so hydrate, history, boolean preview, and fit-selection work again.

### 2026-09-01T10:21Z — loop 109

**Boolean preview fidelity on holes after offset.** Nested offset rings no longer collapse into one hull. Subtract keeps cutter islands; union keeps surviving holes. Offset/outline orients hole winding opposite the outer. Restored the truncated Zustand store (~29kb).

### 2026-09-01T09:45Z — loop 108

**Shapes become paths before offset.** Rect (with radius), ellipse, line, polygon, star, and arrow convert in place to cubic/polyline paths. Offset out and Outline stroke run that conversion first. Inspector Path: Convert to path. Command palette: Convert shape to path. Restored the truncated Zustand store (~29kb).

### 2026-09-01T09:25Z — loop 107

**Rounded, simplified offset outlines.** Offset and outline now fillet corners (radius from stroke width) and simplify the resulting polyline so outlines stay editable.

### 2026-09-01T08:20Z — loop 106

**Outline stroke as a new contour.** Select a path, then Outline stroke / Offset out / Offset in in the inspector (or the command palette).

## Next recommended

Convert text outlines to editable paths.
