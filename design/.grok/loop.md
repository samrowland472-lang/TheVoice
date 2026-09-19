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

1. Guide dash preview on the board when a Print chip is hovered.
2. Per-guide color + dash chips back on the Print row (store APIs exist; UI slice).

## Done

- Named guide labels on the board stroke. Print list has an inline name field; blur/Enter commits (32 chars, empty clears). `renameGuide` / `patchGuide` persist the label. Visible guides paint `guideDisplayName` on the stroke in the resolved color/dash; rulers still carry the tick caption.
- Guide dash chips on the same Print row as color (solid / dash / tight). Click the active chip (or right-click) to clear the override so the stroke falls back to the V/H axis look. Axis look rows, names, lock, hide, Del stay on the row. Command palette Reset guide colors / dashes / Clear guide names.
- Guide color tokens beyond cyan / ice / phosphor: mint, amber, magenta, violet, bone. Axis V/H look rows in Print. Per-guide swatch cycles tokens; right-click clears override. Command palette Reset guide colors / dashes.
- Guide labels in the ruler ticks — each visible guide paints its name (or V/H + pos) on the matching ruler band, with a cyan/ice tick; hidden guides stay off the rulers and the board.
- Click-active per-guide color or dash chip clears the override (`color` / `dash` deleted) so the stroke falls back to the V/H axis look. Print list still writes overrides on first click. Axis look row, names, L / H, Del stay on the row. Command palette Reset guide colors / dashes / Clear guide names.
- Per-guide color + dash in the Print list.
- Guide labels / names, lock / hide, distribute evenly, pair spacing.

## Iteration

2026-09-19 04:20 BST — Named guide labels on the board stroke + Print inline rename.

## Next recommended

Guide dash preview on the board when a Print chip is hovered.
