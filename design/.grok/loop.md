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

1. Path inspector wrap-off: fold leftover `focus({ preventScroll: true })` in `inspector-path.tsx` `holdHoleListAcrossHop` into the same clamp-after-growth helper used by `focusHold` / `focusHoldEl` so hole-list hops cannot keep an out-of-range offset after list growth.

## Done

- Path inspector wrap-off hops in `path-point-row-view.tsx` (`focusHoldEl`) and first-hole X → prev last-X in `path-point-row-fields.tsx` clamp list scroll after growth: snapshot Points + Holes, `focus({ preventScroll: true })`, assign `scrollTop = saved`, then clamp to `scrollHeight - clientHeight` across triple rAF so a taller list cannot keep an out-of-range offset.

- Path inspector wrap-off same-hole / prev-hole header (Shift+Tab) and last-hole X/Y → next-header (Tab) hops in `path-point-row-view.tsx` use `focusHoldEl`: snapshot Points + hole lists, `focus({ preventScroll: true })`, then `restoreListScroll` with clamp-after-growth so the lists cannot keep an out-of-range offset after the hop.

- Path inspector wrap-off Shift+Tab first-outer → Closed / Offset / Outline / Round / Simplify hops in `path-point-row-view.tsx` use `focusHoldEl`: snapshot Points + hole lists, `focus({ preventScroll: true })`, then `restoreListScroll` with clamp-after-growth (assign `scrollTop`, triple rAF) so the Points list cannot keep an out-of-range offset after the hop.

- Path-exit Tab hops (Closed → Offset → Outline → Round → Simplify → first outer point) in `inspector-path-impl.tsx` use `holdExitHop`: `focus({ preventScroll: true })` then `holdListScroll` (assign `scrollTop`, `restoreListScroll`, triple rAF `restoreHoleListScroll` / `clampAfterGrowth`) so the Points list cannot keep an out-of-range offset after the hop. Restored PathFields markup (`data-path-exit`, `data-point-list`, `data-hole-list`) so those exits exist on the inspector.

- Hole-header ↔ last-hole X/Y hops in `inspector-path-impl.tsx` use clamp-after-growth: `focusHold` focuses with `preventScroll`, `holdListScroll` assigns saved `scrollTop`, then `restoreListScroll` plus triple rAF `restoreHoleListScroll` (`clampAfterGrowth`) so a taller list cannot keep an out-of-range offset.

- Wrap-off hole-fill / hole-delete hops reuse `holdHoleListAcrossHop` (same clamp-after-growth as `holdHoleListAcrossOuterHop`): snapshot `[data-hole-list]` from `[data-path-inspector]`, `focus({ preventScroll: true })`, `restoreListScroll` plus triple rAF `restoreHoleListScroll` so a taller hole list cannot keep an out-of-range offset.

- Wrap-off first-hole header ↔ last outer hops clamp hole-list scroll after list growth: snapshot `[data-hole-list]` from `[data-path-inspector]`, `focus({ preventScroll: true })`, assign `list.scrollTop = saved`, then `restoreListScroll` plus a third rAF `restoreHoleListScroll` (`clampAfterGrowth`) so a taller hole list cannot keep an out-of-range offset.

- Path inspector wrap-off hops first-hole header ↔ last outer X/Y hold hole-list scroll through `holdHoleListAcrossOuterHop`.

- Path inspector Shift+Tab from the first hole header onto the last outer path point Y at document level when wrap is off.

## Iteration

2026-09-13 19:16 BST — Wrap-off hops clamp Points + hole-list scroll after growth (`scrollHeight - clientHeight`) in `focusHoldEl` and first-hole X → prev last-X.

## Next recommended

Fold `holdHoleListAcrossHop` in `inspector-path.tsx` into the shared clamp-after-growth helper.
