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

1. Artboard-aware smart guides from unselected siblings while dragging.
2. Convert selected path corners to auto-smooth (average incoming/outgoing tangents).
3. Boolean applyBoolean wired back into store + inspector after the wipe.

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

## Iterations

### 2026-08-29T03:10Z — loop 58

**Pen tangents + restore wiped stage/export.** `canvas-stage.tsx`, `export.ts`, `studio-app.tsx`, and viewport `render.ts` were stubs again; restored board tools. Paths now store optional `in`/`out` handles. Click adds a corner; drag while placing pulls a mirrored smooth tangent. Select a path to drag anchors or handles (Alt breaks the pair). Double-click an anchor to drop handles. Canvas and SVG export draw cubics.

### 2026-08-29T02:20Z — loop 57

**Inspector mixed ink + restore wiped studio files.**

### Next recommended

Smart guides from unselected siblings while dragging, then auto-smooth conversion.
