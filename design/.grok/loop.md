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

1. Boolean ops polish (holes / evenodd multi-contour for subtract).
2. Combine selected shapes UI entry.
3. Pen path boolean refinements.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu, Shift-click zoom %.
- Export selection as PNG (cropped AABB, transparent bg): Export menu, palette, context menu.
- Multi-select marquee polish: dashed stroke + corner ticks; rotation-aware AABB hit.
- Keyboard nudge pulse: selection outline blooms ~220ms on arrow nudge.
- Fit-selection + export-selection fully wired.

## Iterations

### 2026-08-26T21:30Z — loop 47

**Selection tools polish (full vertical slice).** Restored full canvas-stage after placeholder wipe. Marquee: soft fill, dashed cyan stroke, corner ticks. Rotation-aware marquee via marqueeHitsNode/nodeWorldAabb. nudgePulseAt bloom on arrow nudge. requestFitSelection + exportSelectionPng wired (Export menu, palette, context, Shift+0, Shift-zoom%). Typecheck + build clean.

## Next recommended

Boolean ops (union / subtract) for shapes → path node with even-odd holes.
