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

1. Boolean inspector buttons + preview ghost after applyBoolean store wiring.
2. Spacing labels on smart-guide ticks while dragging.
3. Pen tangent edit on the board (drag in/out handles after auto-smooth).

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

## Iterations

### 2026-08-29T05:20Z — loop 60

**Auto-smooth path corners.** Selected paths get cubic handles from averaged incoming/outgoing tangents (third of adjacent segment). Inspector Auto-smooth, Shift+S, command palette. Canvas + SVG export draw cubics. Restored wiped `canvas-stage` / `export` / `studio-app`. `applyBoolean` and zoom-to-selection are on the store again.

### 2026-08-29T04:12Z — loop 59

**Smart guides + restore wiped board.** Dragging a layer (or a multi-select) snaps to artboard edges/center and to unselected siblings' edges, centers, and equal gaps. Cyan dashed lines mark the lock. Also restored `canvas-stage`, `studio-app`, `export`, and viewport `drawDocument` after they collapsed to stubs. `applyBoolean` is on the store again (⌘U union / ⇧⌘U subtract, ⌘I intersect / ⇧⌘I exclude).

### Next recommended

Boolean inspector buttons + preview ghost after applyBoolean.
