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

1. Path inspector: keep Points list scroll when selecting a different hole row while scrolled mid-list.

## Done

- Path inspector keeps Points list scroll when Delete hole removes a ring below the viewport. `shouldHoldPointListScroll` / `shouldHoldHoleListScroll` treat `[data-delete-hole]` like fill-rule; Delete remembers and restores both lists so the remaining points do not jump.

- Path inspector keeps hole-point scroll in the Points list when swapping Even-odd / Nonzero. `shouldHoldPointListScroll` treats `[data-hole-fill]` like Closed / Offset; fill-rule clicks remember and restore Points `scrollTop` so a selected hole point mid-list does not jump.

- Path inspector keeps Holes list scroll when swapping Even-odd / Nonzero after a hole is selected. `shouldHoldHoleListScroll` + `restoreHoleListScroll` skip `scrollIntoView` while `[data-hole-fill]` is focused; Even-odd / Nonzero remember and restore `scrollTop`. Fill-rule swap no longer re-picks the hole if it is already active.

- Path inspector keeps Points list scroll when Tab lands on Closed / Offset. `shouldHoldPointListScroll` + `restorePointListScroll` skip `scrollIntoView` while `data-path-exit` is focused; Closed / Offset remember and restore `scrollTop`.

- Path inspector ← / → walks the active ring and names the point on the canvas strip. `stepPathRingPoint` covers outer path and hole rings; `pathRingWalkStatus` holds `Point 3/12` or `Hole 1 · Point 2/8` (`aria-live`, `data-studio-status=held`). Shift+Home / Shift+End on a hole also announce. Arrow nudge still runs when no path point is picked.

- Path inspector Left Points status holds until the next inspector action. `holdStudioStatus` + `isHeldStudioStatus` keep `Left Points · Closed` / `Offset` on the canvas strip (`aria-live`, `data-studio-status=held`) so tool-hint refresh cannot wipe it. Point focus or an inspector button click calls `releaseStudioStatus`. Closed / Offset keep `data-path-exit`.

- Path inspector Tab onto Closed / Offset announces in the canvas status strip (`Left Points · Closed` / `Left Points · Offset`) via `pathInspectorExitStatus` + `aria-live`. Closed and Offset controls carry `data-path-exit`.

- Path inspector Tab from last point y stays in the inspector: `pickPathInspectorExitTarget` wraps onto Closed / Offset (`data-path-inspector`) instead of page chrome. Shift+Tab from first x lands on Offset.

- Path inspector Tab from the last point y leaves the list: no wrap to the first x. `pathTabExitsAtEdge` + `focusOutsidePathList` move focus to the next control outside `[data-point]` rows. Shift+Tab from the first x still exits the other way. Single-point paths also exit on last y.

- Path inspector Shift+Tab from the first point x leaves the list: no wrap to the last y. `pathTabLeavesList` + `focusPathCoord` only `preventDefault` when a neighbor field exists. Points list now uses the shared `PointRow` (Tab x→y→next x, Smooth/Corner/Del `tabIndex={-1}`).

- Path inspector Tab walks coordinates: Tab from a point x field lands on that point's y, then the next point's x (holes included). Shift+Tab reverses. Smooth / Corner / Del stay mouse-only (`tabIndex={-1}`). Enter still commits without blur.

- Path inspector Enter-commit keeps focus: NumField Enter commits x/y without blur so Tab can walk the next field. Escape still cancels and blurs. Point rows still scroll on focus/commit.

- Path inspector point-field scroll: focusing or committing an x/y NumField selects that point and scrolls its Points row into view (`revealAndSelect` + `onFocus` on NumField). Clicking the row header does the same. ← / → ring walk still uses `[data-point]` scrollIntoView.

## Iteration

2026-09-07 07:16 BST — Points list scroll holds when Delete hole drops a ring below the viewport.

## Next recommended

Path inspector: keep Points list scroll when selecting a different hole row while scrolled mid-list.
