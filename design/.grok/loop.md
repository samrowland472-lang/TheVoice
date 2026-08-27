# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`.
If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`types.ts` / `store.ts` / `render.ts` must be KB, not 11 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Backlog (priority order)

1. Combine selected shapes UI polish (disabled state when <2 boolean-able).
2. Pen path boolean refinements.
3. Rotation-aware boolean (bake rotation into polygon before ops).

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu.
- Boolean ops: subtract punches evenodd holes; union combines shapes into path node. Context menu + command palette.

## Iterations

### 2026-08-27T07:30Z — loop 48

**Boolean ops (holes / evenodd multi-contour).** Restored wiped canvas-stage + studio-app from history; added requestFitSelection. PathNode gains holes[] + fillRule; render fills with evenodd. boolean-ops.ts: nodeToLocalPolygon, subtractShapes (outer+hole), unionShapes (multi-contour nonzero). Store: booleanUnionSelected / booleanSubtractSelected. UI: context menu + command palette. Typecheck + build clean.

### 2026-08-26T21:30Z — loop 47

**Selection tools polish.** Marquee, nudge pulse, fit/export selection wiring.

## Next recommended

Combine UI polish (grey out when selection cannot boolean) + rotation bake for boolean.
