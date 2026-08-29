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

1. Pen tangent handles drawn on the overlay (helpers exist in path-curve).
2. MixedInk panel wired when multi-select has mixed fills.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette.
- Export selection as SVG (tight viewBox, paths keep holes).
- Boolean helpers live in boolean-ops.ts.
- Boolean preview ghost on the board before commit (hover Union/Subtract).
- Rotation-aware second-pass subtract: overlapping holes union so even-odd does not refill.
- Studio chrome restored (was returning null); viewport-aware drawDocument; applyBoolean + Selection SVG.

## Iterations

### 2026-08-29T22:10Z — loop 67

**Board + boolean + selection SVG.** Restored wiped `studio-app` (it returned null) and pointer `canvas-stage`. `drawDocument` takes the viewport again. Inspector Boolean: hover paints a dashed phosphor/warm ghost; click commits. Overlapping subtract punches merge so even-odd does not refill. Export → Selection SVG writes only the selected nodes (paths keep holes) cropped to their bounds.

### 2026-08-29T21:20Z — loop 66

**Rotation-aware second-pass subtract.** Subtracting again on a holed path (including after rotate) unions overlapping punches instead of stacking even-odd rings that cancel.

### 2026-08-29T19:12Z — loop 65

**Boolean preview ghost.** Shift-select two or more shapes and the inspector opens Boolean: Union, Subtract, Intersect, Exclude.

### 2026-08-29T18:10Z — loop 64

**Mixed fill/stroke inspector.**

### 2026-08-29T08:15Z — loop 63

**Pen tangent edit polish.**

## Next recommended

Pen tangent handles on the overlay (path-curve helpers already exist).
