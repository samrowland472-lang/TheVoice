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

1. Boolean preview ghost on the board before commit.
2. Intersect / exclude (xor) beside Union and Subtract.
3. Flip / transform should keep hole windings on combined paths.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board; viewport-aware render + color sampling.
- Zoom to selection: Shift+0, command palette, context menu, Shift-click zoom %.
- Boolean ops: subtract punches evenodd holes from true intersection clip; union clusters overlapping shapes.
- Combine UI: Union / Subtract in context menu + command palette.
- PathNode holes[] + fillRule; render + SVG export multi-contour.
- Rotation-aware second-pass subtract: world-space holes follow rotation; outer CCW / holes CW; overlapping hole rings merge so even-odd does not recancel.
- Inspector path card: point count, hole count, fill-rule control.

## Iterations

### 2026-08-28T22:10Z — loop 53

**Restore wiped stage + rotation-aware holed subtract.** canvas-stage, studio-app, and export were placeholders on main; restored the live artboard and SVG export with hole contours + fill-rule. Viewport-aware render and eyedropper sampling restored. Boolean subtract now keeps inherited holes after rotate, clips new punches to the still-filled region, opposite-winds holes, and merges overlapping rings. Store wires canBoolean / union / subtract and requestFitSelection. Inspector shows path pts/holes and fill-rule. Typecheck + build + browser-smoke.

### 2026-08-28T20:20Z — loop 52

Restore wiped stage + concave boolean clip (stage later wiped again on GitHub).

## Next recommended

Boolean preview ghost on the board before commit.
