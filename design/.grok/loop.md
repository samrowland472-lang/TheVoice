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
2. Context-menu Export selection wiring (optional depth).
3. Fit-selection / export selection PNG if still missing on main.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored from placeholder wipe; eyedropper HUD under the board.
- Zoom to selection (fit selected layers in view): Shift+0, command palette, context menu, Shift-click zoom %.
- Export selection as PNG (cropped AABB, transparent bg): Export menu, command palette, context menu.
- **Multi-select marquee polish**: dashed stroke + corner ticks; rotation-aware AABB hit for tilted layers.
- **Keyboard nudge pulse feedback**: arrow-key translateSelected stamps `nudgePulseAt`; selection outline briefly blooms (RAF) for ~220ms.

## Iterations

### 2026-08-26T10:05Z — loop 45

**Marquee polish + keyboard nudge pulse.** Marquee draw: dashed cyan stroke, soft fill, corner ticks. Selection via marquee uses rotation-aware AABB so rotated nodes are hit correctly. `translateSelected` sets `nudgePulseAt`; canvas overlay expands/brightens selection stroke for ~220ms with requestAnimationFrame frames. Typecheck clean, build clean, browser-smoke: canvas present, no console/page errors on desktop and mobile. Restored full store (~29kb) and canvas-stage (~37kb) from TheVoice-Design after TheVoice main had placeholders.

### 2026-08-23T20:20Z — loop 37

Restored full `store.ts` (was truncated on TheVoice main). Completed zoom-to-selection wiring. Export selection as PNG claimed. Typecheck + build + smoke clean.

### 2026-08-23T17:05Z — loop 36

Zoom to selection wiring. Typecheck + build + smoke clean.

### 2026-08-23T14:20Z — loop 35

Restored full canvas-stage. Eyedropper HUD under the board.

## Next recommended

Boolean ops (union / subtract) for shapes → path node, or polish export selection if missing on deployed main.
