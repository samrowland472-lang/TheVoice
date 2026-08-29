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

1. Mixed fill/stroke inspector when several layers are selected.
2. Boolean preview ghost on the board before commit (hover Union/Subtract).

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu.
- Export selection as PNG.
- Boolean helpers live in boolean-ops.ts.
- Multi-select marquee polish + keyboard nudge feedback.
- Rotation-aware second-pass subtract with hole rings + fill-rule SVG export.
- Boolean preview ghost on the board before commit.
- Intersect and Exclude (xor) beside Union and Subtract.
- Inspector mixed fill/stroke when several layers are selected.
- Restored pointer canvas (marquee, move, draw, pen) after wipe.
- Pen tangent / smooth-point handles: click-drag while drawing, edit on the board, cubic render + SVG.
- Smart guides: artboard + sibling edges/centers + equal-gap snap while dragging.
- Pointer canvas / export / studio-app restored after wipe; applyBoolean on the store (⌘U / ⌘I).
- Auto-smooth selected path corners (average incoming/outgoing tangents). Shift+S, inspector, palette.
- Boolean inspector buttons + live preview ghost; applyBoolean / requestFitSelection / smoothSelectedPath wired.
- Spacing labels on smart-guide ticks while dragging.
- Pen tangent edit: click-drag while placing, drag in/out after smooth, Alt unpairs, cubics in canvas + SVG.

## Iterations

### 2026-08-29T08:15Z — loop 63

**Pen tangent edit polish.** Restored wiped pointer `canvas-stage`, `export.ts`, and `studio-app` so the board draws and takes input again. Pen click-drag writes cubic out/in handles on the new point (mirrored); select or pen can grab those handles after Shift+S auto-smooth. Alt-drag breaks the pair. Paths render and export as cubics (`tracePath` / `pathD`). Store gained `applyBoolean`, `smoothSelectedPath`, `requestFitSelection`, `patchPathPoint`. Spacing ticks still draw when a snap locks.

### 2026-08-29T07:20Z — loop 62

**Spacing labels on smart-guide ticks.** Dragging a layer (or a multi-select) still snaps to artboard and sibling edges/centers/equal gaps. When a snap locks, phosphor dimension ticks draw the gap in board units between the moving box and the neighbor (or artboard edge) that shares an overlap. Labels sit on the tick with a ground chip. Also restored wiped pointer `canvas-stage` and `export.ts` from the studio so the board draws and ships PNG/JPG/SVG again.

### 2026-08-29T06:10Z — loop 61

**Boolean inspector + preview ghost.** Select two or more shapes and the inspector shows Union / Subtract / Intersect / Exclude. Hover switches the cyan dashed ghost on the board; click (or ⌘U / ⇧⌘U / ⌘I / ⇧⌘I) commits a path and drops the source shapes. Also restored wiped `export.ts`, pointer `canvas-stage`, and `studio-app` so the board draws and accepts input again. `requestFitSelection` and `smoothSelectedPath` are on the store.

### Next recommended

Mixed fill/stroke inspector when several layers are selected.
