# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`.
If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`types.ts` / `store.ts` / `render.ts` must be KB, not 11 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Backlog (priority order)

1. (empty — pick next polish or canvas/type/export depth)

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored from placeholder wipe; eyedropper HUD re-applied under the board.

## Iterations

### 2026-08-23T13:19Z — loop 34

Restored `canvas-stage.tsx` after placeholder wipe (was 20 bytes). Re-applied eyedropper HUD under the board. Typecheck + build + smoke clean.

## Next recommended

Polish canvas depth or pick next backlog from product needs.
