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

1. History panel (clickable undo stack).
2. Pen tool: undo last point, close path, Escape to finish.
4. Print / story safe-area overlay + optional bleed on export.
5. Hub folders / tags for recents; pin a project.
6. Brand kit: named colours + font pairing applied to new text.
7. Magic layout: replace-board vs append; structured JSON schema; preview before apply.
8. Paint stroke undo (not the whole bitmap commit).
9. Mobile studio: tool overflow menu, export always reachable, inspector sheets.
10. Contrast checker on text vs fill / artboard.
11. Multi-page / artboard set for a campaign (story + square + banner).
12. PDF-quality export (vector-ish or high-DPI print PNG with crop marks).
13. Components / linked duplicates (edit one, update copies).
14. Color-from-image palette into the brand kit.
15. Present mode speaker notes / click-through frames.
16. Performance: thumbnail cache, paint layer dirty-rect, fewer store redraws.

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
- Image crop (normalized source rect, L/T/R/B insets) + rectangular mask (clip + radius). Canvas, PNG, and SVG honor crop.
- Rulers on the pasteboard; drag from an edge to place a guide; drag a guide back onto the ruler to remove. Objects snap to guides. Toggle in the top bar / command palette.

## Iterations

### 2026-08-22T20:08Z — loop 7b (polish)

Ruler polish: position labels on guides, col/row-resize cursor, double-click to delete, snap-to-8 while dragging. Typecheck + build + smoke clean.

### 2026-08-22T20:04Z — loop 7

Rulers + manual guides. Drag from top/left ruler, snap while moving, drop on ruler to delete. Typecheck + build + smoke clean.

### 2026-08-22T19:57Z — loop 6

Restored truncated `render.ts` (594 bytes → full renderer) and shipped working image crop + rounded mask. Inspector: Left/Right/Top/Bottom crop + mask radius + reset. Typecheck + build + smoke clean.

### 2026-08-22T19:15Z — loop 5

Image crop + rectangular mask. Canvas drawImage uses crop source rect and clips to node (optional radius). SVG export clipPath + scaled image for crop. Inspector: crop X/Y/W/H % + Reset + Center 70%. Typecheck + build + smoke clean.

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

History panel (clickable undo stack).
