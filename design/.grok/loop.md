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

1. Rotation-aware boolean polish on already-holed path nodes (keep hole winding after rotate + second subtract).
2. Boolean preview ghost on the board before commit.
3. Intersect / exclude (xor) beside Union and Subtract.
4. Inspector multi-select: mixed fill/stroke when several layers are selected.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu.
- Export selection as PNG.
- Boolean helpers live in boolean-ops.ts.
- Multi-select marquee polish + keyboard nudge feedback.

## Iterations

### 2026-08-28T22:20Z — loop 53

**Marquee + nudge.** Restored wiped `canvas-stage.tsx` / `export.ts`. Marquee is rotation-aware (`marqueeHitsNode` / `marqueeContainsNode`); live-selects while dragging; Shift unions with the current selection; Alt requires full contain (dashed marquee). HUD under the board shows count + mode. Arrow nudge commits history once per hold (`!repeat`), Shift = 10px, Alt = 0.5px; phosphor HUD shows cumulative Δx/Δy then fades. Typecheck + build + smoke clean.

### 2026-08-28T20:20Z — loop 52

Restore wiped stage + concave boolean clip (Greiner–Hormann).

## Next recommended

Rotation-aware second-pass subtract on already-holed combined paths; optional intersect/exclude.
