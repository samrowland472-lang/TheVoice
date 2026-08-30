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

1. Restore marquee / shape-create / pan overlay beside the live pen.
2. Inspector numeric fields commit on blur for live drag vs typed values.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Boolean helpers in boolean-ops.ts; live inspector hover ghost.
- Rotation-aware contours: cubic handles flattened, then rotated, before punch.
- Overlapping subtract holes merge so even-odd does not refill.
- Paths render holes and cubics with evenodd / nonzero.
- Selection SVG export uses cubic `pathD`, holes, and even-odd / clip-rule.
- Subtract results simplify, restore mirrored cubics, and show hole tangents.
- Selection PNG crop uses rotated path/hole cubic hull + stroke pad.
- Pen overlay hits and drags cubic handles on outer contours **and subtract holes**.
- Inspector Boolean hover + commit: Union / Subtract / Intersect / Exclude preview ghost and apply.
- Canvas overlay restored: marquee select, move + snap, create-drag shapes, pan, paint, pen rubber-band, handles, rulers.
- Live pen cubics while drawing: click-drag handles, rubber-band, cubic `tracePath` on open paths.
- Store `setBooleanPreview` / `applyBoolean` wired; inspector hover paints phosphor ghost; shortcuts Cmd+U / Shift+Cmd+U / Cmd+I / Shift+Cmd+I apply.

## Iterations

### 2026-08-30T10:20Z — loop 79

**Inspector Boolean hover.** Two or more booleanable shapes selected expose Union / Subtract / Intersect / Exclude. Hover (or focus) sets `booleanPreview`; the artboard paints a dashed phosphor ghost from `computeBoolean`. Click commits: the first shape becomes the result path, cutters drop, preview clears. Shift+S still smooths a path; Shift+0 fits the selection.

### 2026-08-30T09:20Z — loop 78

**Live pen cubics.** Pen click-adds anchors and click-drag pulls mirrored handles while the path is still open. Rubber-band follows the cursor with the last outgoing cubic. `drawDocument` strokes paths through `tracePath` so those curves show on the board, not only after close. Enter still closes; handles stay selected.

### 2026-08-30T08:20Z — loop 77

**Canvas overlay restored.** Select-tool marquee and move are live again. Rectangle / ellipse / line / polygon / star / arrow / frame drag-create on the artboard. Viewport pans with Hand or space. Overlay draws grid, guides, selection handles, pen rubber-band, and boolean ghost. `drawDocument` honours viewport + paper offset.

### 2026-08-30T07:20Z — loop 76

**Inspector Boolean.** Two or more selected shapes expose Union, Subtract, Intersect, Exclude. Hover paints a phosphor ghost on the artboard; click (or ⌘U / ⇧⌘U / ⌘I / ⇧⌘I) commits a path and drops the cutters. Viewport now pans the stage so the ghost sits on the board.

### 2026-08-30T06:20Z — loop 75

**Hole-handle drag.** Select or Pen on a path with holes: cooler diamonds on inner contours are live. Drag an in/out arm to reshape the hole; Alt breaks smooth mirroring. Paths stroke through `tracePath`. Store gained `editPathHit`, `applyBoolean`, and fit-selection.

### 2026-08-30T05:16Z — loop 74

**Rotated selection PNG.** `aabb` now samples path anchors, cubic handles, and holes in world space after rotation, then pads by half stroke.

### 2026-08-30T04:12Z — loop 73

**Pen tangents on subtract.** Boolean results drop collinear samples and get mirrored cubic handles.

### 2026-08-30T03:15Z — loop 72

**Selection SVG with holes and cubics.**

### 2026-08-30T02:25Z — loop 71

**Boolean ghost + rotation-aware holes.**

## Next recommended

Restore marquee / shape-create / pan overlay beside the live pen.
