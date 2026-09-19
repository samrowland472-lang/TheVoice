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

1. Persist last-opened document id so a refresh returns to the same artboard.

## Done

- Pair captions on the board take the axis look color, and Print V/H chips preview that color on hover.
- Rail Print hides the guide name field behind a disclosure; click the caption to edit.
- Restored Print guide rows: lock / hide / del, name, color + dash chips, V/H axis looks.
- Store owns printMarks, bleed edges, patchGuide, renameGuide, hover previews.
- Locked guides refuse move/delete; hidden skip the board and hit-tests.
- Board strokes use resolveGuideStroke + dashArray + color/dash hover preview.
- Print section can collapse to a rail; T/R/B/L bleed edge chips stay on the rail with print-marks toggle.
- Click a bleed chip to cycle that edge through None / 3 mm / 6 mm; rail choice persists in localStorage.
- InspectorPrint is mounted under Artboard so print bleed is reachable without a selection.
- Guide color tokens: mint, amber, magenta, violet, bone plus cyan / ice / phosphor.

## Iteration

2026-09-19 18:10 BST — Pair captions pick up hovered V/H look color.

## Next recommended

Persist last-opened document id so a refresh returns to the same artboard.
