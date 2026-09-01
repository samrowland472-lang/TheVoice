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

1. Self-overlapping figure-eight traces still need a winding pass before clip.
2. Knife drag-across (cut a stroke through several segments at once).

## Done

- Knife hits compound holes as well as outers. Cutting a hole lifts it to an open path. Opening a compound outer releases holes as sibling islands. Live boolean hover folds more than two shapes and ghosts every accumulate plus every island. Zustand store restored (~29kb).
- Clipper snaps vertices, splits collinear shared edges, caps high-vertex rings, and drops colinear slivers so abutting squares union cleanly.
- Real polygon clipper for union / subtract / intersect / exclude (edge split + fragment classify + chain). Overlapping squares yield an 8-vertex union and a true L subtract instead of a convex hull. Zustand store restored (~27kb) with hydrate, history, boolean preview, path-edit hit, and fit-sel.
- Convert type to editable paths. Inspector Path row + command palette. Counters become holes. Multi-letter copy becomes one path per island. Offset / outline auto-converts type first.
- Boolean union no longer treats other solids as holes; nested offset rings stay nested (containment is not hulled). Hole windings opposite the outer.
- Zustand store restored (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.
- Boolean preview keeps offset/outline holes: nested rings are not convex-hulled together; subtract punches the cutter and fills islands from cutter holes; windings oriented for evenodd.
- Convert selected shape (rect, ellipse, line, polygon, star, arrow) to an editable path. Offset / outline auto-convert first. Inspector Path row + command palette.
- Offset outlines fillet sharp corners, then Douglas–Peucker simplify. Inspector Offset row: Outline stroke, Round corners, Offset out/in, Simplify.
- Outline stroke / offset path: selected contour becomes a new layer.
- Knife: click a path segment to cut.
- Pen: double-click a corner to auto-smooth; snap two open path ends together to join.
- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Boolean sibling islands land as separate path layers; nested rings stay holes. Zustand store implementation restored (~29kb).

## Iterations

### 2026-09-01T23:35Z — loop 116

**Polish: knife + n-ary boolean actually wired.** Restored the full Zustand store (~29kb) so the studio hydrates. Knife click cuts compound outers and holes; leftover holes become sibling paths. Hovering a boolean on 3+ shapes draws stepwise progress ghosts then every island.

### 2026-09-01T23:20Z — loop 115

**Knife through compounds + multi-boolean progress preview.** Knife now nicks holes, not only the outer ring. Opening a boolean compound promotes holes to their own layers. Hovering Union/Subtract/Intersect/Exclude over three or more shapes draws each fold as a phosphor ghost, with the final islands strongest. Wired knife clicks on the artboard (K). Restored the truncated Zustand store so hydrate, history, and apply still work.

### 2026-09-01T22:15Z — loop 114

**Boolean clipper robustness.** Shared / collinear edges now split at both endpoints instead of being skipped as parallel misses. Vertices snap to a 0.0001 grid so chain-matching does not drop rings. High-vertex traces cap at 480 points. Colinear mid-vertices collapse after chain. Zustand store restored (~29kb) with hydrate, history, boolean preview, path-edit hit, and fit-sel.

### 2026-09-01T20:45Z — loop 113

**Boolean islands as layers.** Union/exclude of disjoint or multi-body results no longer packs sibling contours into one evenodd path. Each island is its own path layer; nested rings remain holes. Restored the truncated Zustand store so hydrate, history, and boolean apply work.

### 2026-09-01T20:35Z — loop 112

**Real boolean clipper.** Union / subtract / intersect / exclude now split contours at crossings, keep or drop edge fragments by inside tests, and chain them into result rings. Concave unions stay concave; subtract punches an L; exclude keeps the overlap as a hole. Restored the truncated Zustand store so the studio hydrates again.

### 2026-09-01T18:20Z — loop 111

**Type to path.** Selected text rasterizes at the live type size, traces outer contours and counters, then replaces the type layer with closed editable paths. Holes keep opposite winding for evenodd. Command palette: Convert type to path. Inspector Type → Path. Zustand store kept whole (~29kb) with boolean preview and path-edit hit.

## Next recommended

Winding pass for self-overlapping figure-eight traces before clip.
