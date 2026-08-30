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

1. Multi-select inspector shows mixed values instead of first-node only.
2. Rotation field as typed NumField (same blur commit as X/Y).

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
- Inspector X/Y/W/H, stroke, and type size draft locally while focused; commit on blur or Enter; Escape restores; live canvas drags still update the field when it is idle.
- DesignState carries `booleanPreview`, `pathEditHit`, and `fit-sel` view intent.
- Inspector tracking / leading as typed NumFields with the same blur commit; sliders still scrub live.

## Iterations

### 2026-08-30T21:20Z — loop 81

**Typed tracking and leading.** Type nodes expose Tracking (px) and Leading (unitless) as `NumField`s: draft while focused, commit on blur or Enter, Escape restores. Size, X/Y/W/H, and stroke width use the same field. Range sliders still live-scrub. Store types boolean preview, path-edit hit, and fit-selection so the artboard typechecks.

### 2026-08-30T20:10Z — loop 80

**Inspector numbers commit on blur.** X / Y / W / H, stroke width, and type size keep a focused draft so mid-type values do not snap the node. Enter commits; Escape restores the live measure. Unfocused fields follow canvas drags. Store now types boolean preview, path-edit hit, and fit-selection so the artboard typechecks.

### 2026-08-30T10:20Z — loop 79

**Inspector Boolean hover.** Two or more booleanable shapes selected expose Union / Subtract / Intersect / Exclude. Hover (or focus) sets `booleanPreview`; the artboard paints a dashed phosphor ghost from `computeBoolean`. Click commits: the first shape becomes the result path, cutters drop, preview clears. Shift+S still smooths a path; Shift+0 fits the selection.

### 2026-08-30T09:20Z — loop 78

**Live pen cubics.** Pen click-adds anchors and click-drag pulls mirrored handles while the path is still open. Rubber-band follows the cursor with the last outgoing cubic. `drawDocument` strokes paths through `tracePath` so those curves show on the board, not only after close. Enter still closes; handles stay selected.

### 2026-08-30T08:20Z — loop 77

**Canvas overlay restored.** Select-tool marquee and move are live again. Rectangle / ellipse / line / polygon / star / arrow / frame drag-create on the artboard. Viewport pans with Hand or space. Overlay draws grid, guides, selection handles, pen rubber-band, and boolean ghost. `drawDocument` honours viewport + paper offset.

## Next recommended

Multi-select inspector shows mixed values instead of first-node only.
