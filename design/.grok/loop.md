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

1. Present-mode keyboard: Home / End jump to first / last page in the set.

## Done

- Present-mode active page-dot ring: the live frame keeps a tight phosphor ring on ground; focus-visible thickens it; inactive dots only ring when focused.
- Inspector restored (board, geometry, ink, type) after a placeholder file broke typecheck.
- Campaign page actions on the store: rename, duplicate, unlink, delete, reorder, Alt+arrow nudge.
- Present-mode speaker notes drawer: **N** toggles notes; **Escape** closes the drawer first, then exits present.
- Campaign chip context menu: rename, duplicate, unlink, delete page.

## Iteration

2026-09-21 16:25 BST — Tight present-mode active page-dot phosphor ring; inspector restored.

## Next recommended

Present-mode Home / End to jump the first / last campaign page.
