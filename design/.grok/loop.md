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

1. Path inspector wrap-off: reuse `holdHoleListAcrossOuterHop` clamp-after-growth for hole-fill / hole-delete hops that still assign `scrollTop` without clamp.

## Done

- Wrap-off first-hole header ↔ last outer hops clamp hole-list scroll after list growth: snapshot `[data-hole-list]` from `[data-path-inspector]`, `focus({ preventScroll: true })`, assign `list.scrollTop = saved`, then `restoreListScroll` plus a third rAF `restoreHoleListScroll` (`clampAfterGrowth`) so a taller hole list cannot keep an out-of-range offset.

- Path inspector wrap-off hops first-hole header ↔ last outer X/Y hold hole-list scroll through `holdHoleListAcrossOuterHop`.

- Path inspector Shift+Tab from the first hole header onto the last outer path point Y at document level when wrap is off.

## Iteration

2026-09-13 12:08 BST — Wrap-off first-hole header ↔ last outer hops clamp hole-list scroll after growth (triple rAF + restoreHoleListScroll).

## Next recommended

Reuse `holdHoleListAcrossOuterHop` clamp-after-growth for hole-fill / hole-delete hops that still assign `scrollTop` without clamp.
