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

1. Path inspector: keep Holes list scroll when Tab walks from Delete hole onto the next hole header while the list is mid-scroll.

## Done

- Path inspector keeps Holes list scroll when Shift+Tab walks from a hole header into the previous hole. `pickPreviousHoleTabTarget` focuses the previous card's last control, `tagHoleHeaderTabCrossing` marks `data-hole-header-tab`, and `shouldHoldHoleListScroll` restores `scrollTop` instead of `scrollIntoView`.

- Path inspector keeps Points list scroll when Shift+Tab walks from a hole point back into the previous hole. `tagHolePointTabCrossing` clears the stale `data-hole-point` mark, tags the previous-hole destination, and `shouldHoldPointListScroll` restores `scrollTop` instead of `scrollIntoView`.

## Iteration

2026-09-07 13:10 BST — Holes list scroll holds when Shift+Tab walks from a hole header into the previous hole mid-list.

## Next recommended

Path inspector: keep Holes list scroll when Tab walks from Delete hole onto the next hole header while the list is mid-scroll.
