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

1. Tighten the Print guide row wrap if chips crowd the inspector.
2. Axis look rows (V/H default color + dash) with live board preview.

## Done

- Guide color hover preview on the board. Hover or focus a Print color swatch and the matching stroke adopts that token until the pointer leaves. Active click still clears the override.
- Guide dash preview on the board when a Print chip is hovered.
- Print list restored: per-guide color + dash chips, inline name, lock, hide, Del. Store `patchGuide` drops undefined keys; `renameGuide` / `clearGuideLabels`; locked guides refuse move/delete.
- Board strokes use `resolveGuideStroke` + `dashArray`; selected and locked guides read thicker; names paint on the stroke; hidden guides stay off the board.
- Named guide labels on the board stroke and ruler ticks.
- Guide color tokens: mint, amber, magenta, violet, bone plus cyan / ice / phosphor.
- Click-active per-guide color or dash chip clears the override.
- Guide labels / names, lock / hide, distribute evenly, pair spacing.

## Iteration

2026-09-19 08:20 BST — Guide color hover preview on the board + Print chips restored.

## Next recommended

Tighten the Print guide row wrap if chips crowd the inspector.
