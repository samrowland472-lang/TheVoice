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

1. Click-active color/dash chip to clear per-guide override (fall back to axis look).
2. Guide labels in the ruler ticks.

## Done

- Per-guide color + dash in the Print list: cyan / ice / phosphor dots and dash / tight / solid chips write `guide.color` / `guide.dash`. Axis V/H look row still sets the default. Canvas strokes use the override; selected stay phosphor; locked use a tight dash; hidden stay off the board and skip hit-test. Names, L / H, and Del stay on the row. Command palette “Reset guide colors” and “Distribute selected guides evenly”.
- Per-guide dash override: Print list D / T / S chips write `guide.dash` (dash / tight / solid).
- Per-guide color override: Print list color dots write `guide.color`.
- Guide labels / names: Print list name field next to position; empty falls back to V/H + pos. Names draw on the artboard.
- Guide color / style per axis: Print inspector V/H color dots and dash chips. Looks persist in localStorage.
- Distribute selected guides evenly: Print **Even** spaces 3+ selected (or all) same-axis guides between first and last.
- Guide lock / hide: Print list L / H chips. Locked refuse drag, numeric move, Delete, and Clear. Hidden leave the artboard and hit-test.
- Multi-guide select + nudge, pair spacing, distance readout, snap-to-object.
- Present-mode Safe / Marks chrome and inspector Print bleed / crop marks.

## Iteration

2026-09-18 19:25 BST — Per-guide color dots and dash chips in Print; canvas draws look, lock dash, labels, skip hidden.

## Next recommended

Click-active color/dash chip to clear the override and fall back to the axis look.
