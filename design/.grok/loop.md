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

1. Present-mode Safe / Marks chrome if live editor overlays already suffice.
2. Guide snap-to-object when dragging from the inspector list.

## Done

- Inspector Print + Guides: None/3 mm/6 mm chips highlight uniform bleed; T/R/B/L fields write `bleedEdges`; Print marks checkbox + command palette Show/Hide. Live crop marks and bleed band on the artboard; safe-area inset when Safe area is on. Guide list Add V/H, numeric pos, Del, Clear. Prefs persist. `setBleed` writes matching `bleedEdges`.
- Print-mark toggle in inspector + top bar (Crop) draws live crop / registration marks on the artboard.

## Iteration

2026-09-17 21:20 BST — Inspector Print + Guides wired to live crop marks, bleed band, and persistent guide list.

## Next recommended

Present-mode Safe / Marks chrome if live editor overlays already suffice.
