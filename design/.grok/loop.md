# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`. If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`store.ts` should be tens of KB, not 24 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Rules for every iteration

1. Read `/workspace/AGENTS.md` and this file before editing.
2. Follow-up edit in place. Restore from TheVoice `design/` or TheVoice-Design if the workspace was wiped.
3. Skip anything already in **Done**. Pick the highest-impact item from **Backlog**.
4. One slice per run. Finish it.
5. Verify: typecheck, build, browser-smoke. Leave preview up via startup.sh.
6. Append an Iteration note. Move shipped item Backlog → Done.
7. Push real files to TheVoice `design/` on main.
8. User-facing summary only.

## Backlog (priority order)

1. Image crop + rectangular mask.
2. Manual guides + rulers (drag from edge, snap while moving).
4. History panel (clickable undo stack).
5. Pen tool: undo last point, close path, Escape to finish.
6. Print / story safe-area overlay + optional bleed on export.
7. Hub folders / tags for recents; pin a project.
8. Brand kit: named colours + font pairing applied to new text.
9. Magic layout: replace-board vs append; structured JSON schema; preview before apply.
10. Paint stroke undo (not the whole bitmap commit).
11. Mobile studio: tool overflow menu, export always reachable, inspector sheets.
12. Contrast checker on text vs fill / artboard.
13. Multi-page / artboard set for a campaign (story + square + banner).
14. PDF-quality export (vector-ish or high-DPI print PNG with crop marks).
15. Components / linked duplicates (edit one, update copies).
16. Color-from-image palette into the brand kit.
17. Present mode speaker notes / click-through frames.
18. Performance: thumbnail cache, paint layer dirty-rect, fewer store redraws.

## Done

- Hub: templates, brand kit, recents, search, duplicate project, drop-image-to-board, command palette.
- Studio: tools, canvas, layers, inspector, AI director, paint dock, shortcuts.
- Canvas: marquee select, smart guides, space-pan, wheel zoom, drop/paste images, context menu, zoom HUD, alt-duplicate, shift-constrain.
- Edit: copy/cut/paste, select all, flip, rotate 90°, lock/hide, bring forward.
- Inspector: gradients, shadows, image filters, tracking, leading, flip/rotate/distribute.
- Present mode (⇧P / Esc).
- Export PNG/JPG/SVG with 1×/2×/3×.
- Templates including **100 Hour Loop**, Field Banner, Studio Manifesto, Reel Hook.
- Studio chrome is full-bleed (no marketing sidebar on the board).
- Layers: drag-to-reorder via grip; Shift-click multi-select; block move.
- Align: **Selection** (2+ objects, relative to their bounds) or **Artboard**. Distribute still uses selection span.
- SVG export: linear gradients, images, paint bitmaps, wrapped tspans, paths, polygon/star/arrow/line, opacity, blend, shadows. XML escaped.

## Iterations

### 2026-08-22T18:18Z — loop 4

Faithful SVG export. Signal Album SVG includes text tspans, ellipses, rects, letter-spacing. Typecheck + build + smoke clean.

### 2026-08-22T18:05Z — loop 3

Selection-relative align with explicit Selection / Artboard toggle. Restored studio after wipe/corrupt placeholder push (`store.ts` was 24 bytes). Typecheck + build + smoke clean.

### 2026-08-22T16:18Z — loop 2 (restore)

Restored from TheVoice `design/`. Vite ignores `artifacts/`.

### 2026-08-22 — loop 1

Layer drag-to-reorder.

### 2026-08-22 — loop 0 (manual)

Command palette, marquee, smart guides, clipboard, present, inspector depth, templates.

## Next recommended

Image crop + rectangular mask.
