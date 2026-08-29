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

1. Intersect / exclude (xor) beside Union and Subtract.
2. Inspector multi-select: mixed fill/stroke when several layers are selected.
3. Export selection as PNG from the board context menu.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu.
- Export selection as PNG.
- Boolean helpers live in boolean-ops.ts.
- Multi-select marquee polish + keyboard nudge feedback.
- Rotation-aware second-pass subtract: outer CCW / holes CW, overlapping holes merged, Union + Subtract in inspector / command / context menu. SVG export writes hole rings + fill-rule.
- Boolean preview ghost on the board before commit (hover Union/Subtract).

## Iterations

### 2026-08-29T00:21Z — loop 55

**Boolean preview ghost + restore wiped studio files.** Restored `canvas-stage.tsx`, `export.ts`, and `studio-app.tsx` after placeholder wipes. Hover Union or Subtract in the inspector to ghost the result on the artboard (phosphor for union, alert for subtract); click, ⌘U / ⇧⌘U, command palette, or the board menu to commit. Viewport-aware render + eyedropper sampling restored. Typecheck + build + smoke clean.

### 2026-08-28T23:10Z — loop 54

**Boolean second pass.** Restored real `canvas-stage.tsx` + `export.ts` into the live studio. Subtract now maps rotated world holes, forces opposite winding, and merges overlapping punches so a second subtract after rotate does not refill evenodd islands. Union / Subtract live in the inspector (two or more shapes), command palette, and board context menu. Path SVG export includes holes. Typecheck + build + smoke clean.

## Next recommended

Intersect / exclude boolean ops, then inspector mixed-property multi-select.
