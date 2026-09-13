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

1. Path inspector wrap-off: apply clamp-after-growth to remaining path-exit Tab hops (Closed / Offset / Outline / Round / Simplify) that still call `holdListScroll` after a raw `focus()`.

## Done

- Hole-header ↔ last-hole X/Y hops in `inspector-path-impl.tsx` use clamp-after-growth: `focusHold` focuses with `preventScroll`, `holdListScroll` assigns saved `scrollTop`, then `restoreListScroll` plus triple rAF `restoreHoleListScroll` (`clampAfterGrowth`) so a taller list cannot keep an out-of-range offset.

- Wrap-off hole-fill / hole-delete hops reuse `holdHoleListAcrossHop` (same clamp-after-growth as `holdHoleListAcrossOuterHop`): snapshot `[data-hole-list]` from `[data-path-inspector]`, `focus({ preventScroll: true })`, `restoreListScroll` plus triple rAF `restoreHoleListScroll` so a taller hole list cannot keep an out-of-range offset.

- Wrap-off first-hole header ↔ last outer hops clamp hole-list scroll after list growth: snapshot `[data-hole-list]` from `[data-path-inspector]`, `focus({ preventScroll: true })`, assign `list.scrollTop = saved`, then `restoreListScroll` plus a third rAF `restoreHoleListScroll` (`clampAfterGrowth`) so a taller hole list cannot keep an out-of-range offset.

- Path inspector wrap-off hops first-hole header ↔ last outer X/Y hold hole-list scroll through `holdHoleListAcrossOuterHop`.

- Path inspector Shift+Tab from the first hole header onto the last outer path point Y at document level when wrap is off.

## Iteration

2026-09-13 14:28 BST — Hole-header ↔ last-hole X/Y hops clamp list scroll after growth via `holdListScroll` + `restoreHoleListScroll`.

## Next recommended

Apply clamp-after-growth to remaining path-exit Tab hops (Closed / Offset / Outline / Round / Simplify) that still call `holdListScroll` after a raw `focus()`.
