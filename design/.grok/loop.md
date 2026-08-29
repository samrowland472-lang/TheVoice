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

1. MixedInk panel wired when multi-select has mixed fills.
2. Boolean preview ghost polish (live hover on inspector Union/Subtract).

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette.
- Export selection as SVG (tight viewBox, paths keep holes).
- Boolean helpers live in boolean-ops.ts.
- Boolean preview ghost on the board before commit (hover Union/Subtract).
- Rotation-aware second-pass subtract: overlapping holes union so even-odd does not refill.
- Studio chrome restored (was returning null); viewport-aware drawDocument; applyBoolean + Selection SVG.
- Pen tangent handles on the overlay (draw + drag in/out/anchor; Alt breaks smooth).

## Iterations

### 2026-08-29T23:20Z — loop 68

**Pen tangent overlay.** Restored wiped studio-app / canvas-stage. Selected paths show phosphor arms and diamond handles. Drag an in/out handle to reshape the cubic; Alt breaks the mirror. Anchors move under Select. Shift+S auto-smooths the selected path (writes handles). Paths render with `tracePath` so the board matches the handles. Typecheck + build + smoke clean.

### 2026-08-29T22:10Z — loop 67

**Board + boolean + selection SVG.** Restored wiped `studio-app` and pointer `canvas-stage`.

### 2026-08-29T21:20Z — loop 66

**Rotation-aware second-pass subtract.**

### 2026-08-29T19:12Z — loop 65

**Boolean preview ghost.**

### 2026-08-29T18:10Z — loop 64

**Mixed fill/stroke inspector.**

## Next recommended

MixedInk panel wired when multi-select has mixed fills.
