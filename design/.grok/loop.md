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

1. Export selection as PNG polish (menu wiring if still thin).
2. Multi-select marquee polish / keyboard nudge pulse feedback.
3. Boolean ops polish (holes / evenodd multi-contour for subtract).

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Zoom to selection (Shift+0, command palette).
- Layer search / filter in layers panel (loop 39 claim).
- **Full store.ts restored (~30kb) with working history, nodes, paint, guides, campaigns.**
- **Full canvas-stage restored (~36kb).**
- **requestFitSelection + fit-selection view intent wired (aabb + fitBoxViewport).**
- **studio-app.tsx restored (was truncated to return null).**
- **Boolean ops (union / subtract) for shapes → path node.**

## Iterations

### 2026-08-26T03:12Z — loop 43

Restored placeholder/truncated files from history (store ~30kb, canvas-stage ~36kb, studio-app). Re-wired `requestFitSelection` + `fit-selection` ViewIntent. **Boolean ops**: new `boolean-ops.ts` (shape→polygon, convex-friendly union/subtract, path result); `booleanSelected` store action; context menu + command palette “Union shapes” / “Subtract shapes”. Typecheck clean, build clean, browser-smoke: canvas present, no console/page errors on desktop and mobile.

### 2026-08-25T23:17Z — loop 42

Main had PLACEHOLDER store.ts (11 bytes), empty canvas-stage.tsx, and truncated studio-app (return null). Restored full store.ts (~29kb from history), full canvas-stage.tsx (~35kb), full studio-app.tsx. Wired `requestFitSelection` + `fit-selection` ViewIntent end-to-end.

## Next recommended

Export selection as PNG polish (menu wiring if still thin).
