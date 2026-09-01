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

1. Path offset / outline stroke as a new contour.

## Done

- Knife: click a path segment to cut. Closed contours open at the nick; open paths split into two layers. Phosphor crosshair preview. `K` selects the tool. Zustand store implementation restored (~29kb).
- Pen: double-click a corner to auto-smooth; snap two open path ends together to join (9px ring). Zustand store implementation restored (~29kb).
- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.

## Iterations

### 2026-09-01T07:20Z — loop 104

**Knife cut on a clicked segment.** `K` or the scissors tool. Hover a path to see a phosphor nick; click splits the contour (`cutContour` / de Casteljau). Closed paths open at the cut; open paths become two layers. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

## Next recommended

Path offset / outline stroke as a new contour.
