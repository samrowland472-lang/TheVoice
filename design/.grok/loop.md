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

1. Inspector bleed / print-mark overlay.

## Done

- Mixed shadow chip hover ghosts: hovering a mixed color / blur / offset / spread / inset chip paints a phosphor canvas ghost with that field stamped onto every selected layer (`shadowColor`…`shadowInset` on `StrokeGhost`). Leaves the chip without writing. SVG escape in `export.ts` restored (`&amp;` / `&quot;`).
- Present-mode and editor safe-area overlay: `drawSafeArea` paints title-safe insets from `safeInsets` after the document. Dark grounds get a dim even-odd veil plus a black then phosphor dual stroke and corner ticks; light grounds invert (white then ink). Present chrome exposes a Safe on/off control. Overlay is live-only (respects `safeArea` store flag).
- Mixed width / dash / offset slider and chip hover ghosts.
- Mixed fill-rule chip hover ghost on paths with holes.
- Corner-radius hover ghost on mixed rectangles.
- Sides hover ghost on mixed polygons / stars.
- Mixed cap / join chip hover ghost.
- Arrow head-scale hover ghost.
- Slider drag ghosts (partial; now wired on canvas).
- Arrow heads as true paths on canvas.

## Iteration

2026-09-17 05:32 BST — Mixed shadow chip hover ghosts on the artboard.

## Next recommended

Inspector bleed / print-mark overlay.
