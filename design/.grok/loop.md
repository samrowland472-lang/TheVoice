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

1. Bleed edge chips stay visible when the Print panel is collapsed to a rail.
2. Inspector Print compact mode: hide name field under a disclosure when the panel is a rail.

## Done

- Inspector Print rows wrap on a narrow panel: name + lock/hide/del on the first line, color and dash chips wrap on the second.
- Axis look rows (V/H default color + dash) wrap the same way; hover previews the stroke on the board.
- `patchGuide` drops undefined keys; locked guides refuse move/delete; hidden stay off the board and off hit-tests.
- Board strokes use `resolveGuideStroke` + `dashArray` + `guideLookHover`; selected and locked read thicker; names paint on the stroke.
- Axis look rows: V/H default color + dash chips with live board hover preview (`guideLookHover`).
- Restored Print guide rows: name, lock/hide/del, per-guide color + dash chips, hover preview, wrap.
- Store: `patchGuide` drops undefined keys; locked guides refuse move/delete; print marks toggle.
- Guide color tokens: mint, amber, magenta, violet, bone plus cyan / ice / phosphor.

## Iteration

2026-09-19 15:45 BST — Inspector Print row compact chip wrap on a narrow panel.

## Next recommended

Bleed edge chips stay visible when the Print panel is collapsed to a rail.
