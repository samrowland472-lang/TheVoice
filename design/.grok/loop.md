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

1. Boolean ops (union / subtract) for shapes.
2. Export selection as PNG polish (menu wiring if still thin).
3. Multi-select marquee polish / keyboard nudge pulse feedback.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Zoom to selection (Shift+0, command palette).
- Layer search / filter in layers panel (loop 39 claim).
- **Full store.ts restored (~29kb) with working history, nodes, paint, guides, campaigns.**
- **Full canvas-stage restored (~35kb).**
- **requestFitSelection + fit-selection view intent wired (aabb + fitBoxViewport).**

## Iterations

### 2026-08-25T16:16Z — loop 41

Restored truncated `store.ts` (0 bytes → ~29kb from history) and `canvas-stage.tsx` (0 bytes → ~35kb). Wired `requestFitSelection` + `fit-selection` ViewIntent end-to-end: store action, canvas-stage handler via `aabb` + `fitBoxViewport`, Shift+0 shortcut, command palette “Zoom to selection”. Typecheck clean, build clean, browser-smoke: canvas present, no page errors (desktop clean; mobile hydration caret-color noise only).

### 2026-08-25T09:09Z — loop 40

Restored full `store.ts` from git history (was truncated to stubs on main). Added `fit-selection` to ViewIntent and implemented it in canvas-stage via `aabb` + `fitBoxViewport`. Typecheck clean, build clean, browser-smoke clean (canvas present, no console/page errors).

### 2026-08-25T05:25Z — loop 39

Restored full `store.ts` (~29kb). Wired `requestFitSelection` + fit-selection view intent. **Layer search / filter**: search by name/kind; chips All/Shown/Hidden/Locked; reorder off while filtered. Typecheck clean.

## Next recommended

Boolean ops (union / subtract) for shapes.
