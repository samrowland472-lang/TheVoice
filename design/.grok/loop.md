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

1. History list labels — replace generic “Step N / Redo N” with action names when the store records them.
2. Layer search / filter in the layers panel.

## Done

- Double-click a layer name in the Layers panel to rename it. Enter commits, Escape cancels, blur commits a trimmed name. Empty names are ignored.

- Path inspector wrap-off helpers folded onto shared `path-point-tab-b` (`snapshotList`, `holdListScroll`, `focusHoldEl`, `focusHold`, `holdExitHop`).

## Iteration

2026-09-14 13:15 BST — Layers panel: double-click rename with Enter / Escape / blur.

## Next recommended

Named history steps in the layers History list, or a filter field above the layer stack.
