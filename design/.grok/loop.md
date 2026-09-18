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

1. Guide color tokens beyond cyan / ice / phosphor.

## Done

- Guide labels in the ruler ticks — each visible guide paints its name (or V/H + pos) on the matching ruler band, with a cyan/ice tick; hidden guides stay off the rulers and the board.
- Click-active per-guide color or dash chip clears the override (`color` / `dash` deleted) so the stroke falls back to the V/H axis look. Print list still writes overrides on first click. Axis look row, names, L / H, Del stay on the row. Command palette Reset guide colors / dashes / Clear guide names.
- Per-guide color + dash in the Print list.
- Guide labels / names, lock / hide, distribute evenly, pair spacing.

## Iteration

2026-09-18 22:10 BST — Guide names on ruler ticks.

## Next recommended

Guide color tokens beyond cyan / ice / phosphor.
