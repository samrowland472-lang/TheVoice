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

1. Export selection as PNG.
2. Multi-select marquee polish / keyboard nudge feedback.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored from placeholder wipe; eyedropper HUD re-applied under the board.
- Full canvas-stage restored (35kb) after GitHub stub; eyedropper HUD: Click sample · kit chip · Shift+click.
- Zoom to selection (fit selected layers in view): Shift+0, command palette, context menu, Shift-click zoom %.

## Iterations

### 2026-08-23T17:05Z — loop 36

Zoom to selection. `requestFitSelection` + `fitBoxViewport`; AABB of selected nodes (incl. rotation). Wire: ⇧0, command palette "Zoom to selection", context menu, Shift-click zoom %. Empty selection falls back to fit artboard. Typecheck + build + smoke clean.

### 2026-08-23T14:20Z — loop 35

Restored full canvas-stage (was 4kb stub on GitHub). Eyedropper HUD under the board. Typecheck + build + smoke clean.

### 2026-08-23T13:19Z — loop 34

Restored `canvas-stage.tsx` after placeholder wipe (was 20 bytes). Re-applied eyedropper HUD under the board. Typecheck + build + smoke clean.

## Next recommended

Export selection as PNG.
