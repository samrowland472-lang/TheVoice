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

1. Type-to-path and PNG/SVG export honor opsz / wdth the same way the board does.
2. Type chips label optical size / width when those axes differ across the selection.

## Done

- Inspector mixed type optical size / width: Fraunces shows Optical (auto from size or locked), Instrument Sans shows Width; multi-select writes only onto faces that support the axis; Auto from size clears the lock.
- Inspector mixed type write-through: family, weight, tracking, leading, align, and uppercase write onto every selected text layer; mixed size scales from the key so the stack keeps its steps; type a size to flatten; chips / Match key stamp the full stack.
