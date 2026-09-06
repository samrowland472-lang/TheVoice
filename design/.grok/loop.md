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

1. Path inspector: Tab from the last point y should leave the list without wrapping to the first x.

## Done

- Path inspector Shift+Tab from the first point x leaves the list: no wrap to the last y. `pathTabLeavesList` + `focusPathCoord` only `preventDefault` when a neighbor field exists. Points list now uses the shared `PointRow` (Tab x→y→next x, Smooth/Corner/Del `tabIndex={-1}`).

- Path inspector Tab walks coordinates: Tab from a point x field lands on that point's y, then the next point's x (holes included). Shift+Tab reverses. Smooth / Corner / Del stay mouse-only (`tabIndex={-1}`). Enter still commits without blur.

- Path inspector Enter-commit keeps focus: NumField Enter commits x/y without blur so Tab can walk the next field. Escape still cancels and blurs. Point rows still scroll on focus/commit.

- Path inspector point-field scroll: focusing or committing an x/y NumField selects that point and scrolls its Points row into view (`revealAndSelect` + `onFocus` on NumField). Clicking the row header does the same. ← / → ring walk still uses `[data-point]` scrollIntoView.

## Iteration

2026-09-06 15:14 BST — Shift+Tab from first point x leaves the Points list.

## Next recommended

Path inspector: Tab from the last point y should leave the list without wrapping to the first x.
