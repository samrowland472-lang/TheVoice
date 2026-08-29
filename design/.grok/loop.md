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

1. Export selection as SVG (PNG already ships).
2. Boolean preview ghost on hover after the restored pointer board.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu.
- Export selection as PNG.
- Boolean helpers live in boolean-ops.ts.
- Multi-select marquee polish + keyboard nudge feedback.
- Inspector mixed fill/stroke when several layers are selected.
- Boolean preview ghost on the board before commit (hover Union/Subtract).
- Rotation-aware second-pass subtract: overlapping holes union so even-odd does not refill; world-space rotation on holed paths; pointer board + Boolean inspector restored.

## Iterations

### 2026-08-29T21:20Z — loop 66

**Rotation-aware second-pass subtract.** Subtracting again on a holed path (including after rotate) unions overlapping punches instead of stacking even-odd rings that cancel. Cutter voids stay solid. Board pointer (select, move, draw, pan, wheel zoom) and viewport draw were restored so the op is usable. Inspector Boolean: Union / Subtract / Intersect / Exclude. Typecheck + build + smoke clean.

### 2026-08-29T19:12Z — loop 65

**Boolean preview ghost.** Shift-select two or more shapes and the inspector opens Boolean: Union, Subtract, Intersect, Exclude. Hover (or focus) a button to paint a dashed phosphor ghost of the result on the board; Subtract uses a warm cut tint. Click commits via applyBoolean; ⌘U / ⇧⌘U / ⌘I / ⇧⌘I stay wired. Restored wiped `export.ts`, pointer `canvas-stage`, and `studio-app`. Path fill now punches holes. Typecheck + build + smoke clean.

### 2026-08-29T18:10Z — loop 64

**Mixed fill/stroke inspector.** Shift-select two or more layers and the inspector opens a Selection block: fill, stroke, width, and opacity write across the set. Mixed values show a count chip and a blank width field; a colour pick or “Fill all with ink” unifies them. Restored PathPoint on path nodes so cubic path helpers typecheck. Typecheck + build + smoke clean.

### 2026-08-29T08:15Z — loop 63

**Pen tangent edit polish.** Restored wiped pointer `canvas-stage`, `export.ts`, and `studio-app` so the board draws and takes input again.

## Next recommended

Export selection as SVG (PNG already ships).
