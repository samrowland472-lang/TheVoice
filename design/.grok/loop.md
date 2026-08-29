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

1. Pen tangent / smooth-point handles on the board.
2. Artboard-aware smart guides from unselected siblings while dragging.
3. Pointer tools on the board (marquee, move, draw) — stage still paints only.

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

## Iterations

### 2026-08-29T02:20Z — loop 57

**Inspector mixed ink + restore wiped studio files.** `export.ts` and `studio-app.tsx` were stubs; restored raster/SVG/PDF export (path hole rings + fill-rule) and the studio chrome. Viewport-aware `drawDocument`. Inspector shows Fill · mixed / Stroke · mixed on multi-select and writes one color or weight to every selected layer. Shift+0 zoom-to-selection and command “Export selection PNG”.

### 2026-08-29T01:10Z — loop 56

**Intersect / Exclude + restore wiped files.** Restored `canvas-stage.tsx`, `studio-app.tsx`, `export.ts`, and viewport `render.ts`. Two or more shapes now Union / Subtract / Intersect / Exclude from the inspector, board menu, command palette, and ⌘U / ⇧⌘U / ⌘I / ⇧⌘I. Hover ghosts the result. SVG export writes hole rings + fill-rule. Selection PNG export and zoom-to-selection (⇧0) live again.

### 2026-08-29T00:21Z — loop 55

**Boolean preview ghost + restore wiped studio files.**

### 2026-08-28T23:10Z — loop 54

**Boolean second pass.**

## Next recommended

Pen tangent / smooth-point handles, then smart guides while dragging.
