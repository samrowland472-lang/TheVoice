# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`. If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`types.ts` / `store.ts` / `render.ts` must be KB, not 11 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Backlog (priority order)

1. Hub folders / tags for recents; pin a project.
2. Brand kit: named colours + font pairing applied to new text.
5. Magic layout: replace-board vs append; structured JSON schema; preview before apply.
6. Paint stroke undo (not the whole bitmap commit).
7. Mobile studio: tool overflow menu, export always reachable, inspector sheets.
8. Contrast checker on text vs fill / artboard.
9. Multi-page / artboard set for a campaign (story + square + banner).
10. PDF-quality export (vector-ish or high-DPI print PNG with crop marks).
11. Components / linked duplicates (edit one, update copies).
12. Color-from-image palette into the brand kit.
13. Present mode speaker notes / click-through frames.
14. Performance: thumbnail cache, paint layer dirty-rect, fewer store redraws.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Layer drag, selection-relative align, faithful SVG, image crop + mask.
- Rulers + manual guides (labels, cursor, double-click delete).
- History panel: clickable undo stack under Layers (Now / Step N / Redo).
- Pen: ⌫ last point, Enter or click first point to close, Esc / double-click to finish. Rubber-band preview.
- Safe area overlay (story/print-aware) + bleed on PNG/JPG with crop marks.

## Iterations

### 2026-08-22T20:23Z — loop 10

Safe-area overlay + export bleed. Typecheck + build + smoke clean.

### 2026-08-22T20:18Z — loop 9

Pen tool finish: undo last point, close path, Escape. Typecheck + build + smoke clean.

### 2026-08-22T20:13Z — loop 8

History panel under Layers. Click a step to restore; Undo/Redo in the list. Restored truncated `types.ts` (11 bytes). Typecheck + build + smoke clean.

### 2026-08-22T20:08Z — loop 7b

Ruler polish: labels, cursor, double-click delete.

### 2026-08-22T20:04Z — loop 7

Rulers + manual guides.

## Next recommended

Hub folders / tags for recents; pin a project.
