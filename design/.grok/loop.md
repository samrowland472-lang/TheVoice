# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Hourly automated pass (Grok automation `voice-design-100h-loop`). App notification on each ship. If the previous iteration is < 50 minutes old, polish that slice or skip.


**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Rules for every iteration

1. Read `/workspace/AGENTS.md` and this file before editing.
2. Follow-up edit in place. HMR is live on the existing app — do not kill `:8080` unless `vite.config` / deps change, and restore `startup.sh` → `npm run dev` if you do.
3. Skip anything already in **Done**. Pick the highest-impact item from **Backlog** (or a real bug you can reproduce).
4. One slice per run. Finish it. No drive-by refactors, no second visual language, no emoji chrome.
5. Verify before finishing:
   - `npm run typecheck`
   - `npm run build`
   - `node scripts/browser-smoke.mjs` (dev `:8080`) — inspect both screenshots
   - After a successful build: `npm run preview` on `:8081` and smoke with `--baseline /workspace/screenshots/app-builder-preview.json`
6. Append an **Iteration** note below (date, what shipped, files, leftover risk).
7. Move the shipped item from Backlog → Done. Add new gaps you discovered to Backlog.
8. User-facing summary only — no ports, paths, or tool names.

## Backlog (priority order)

1. Align / distribute relative to the **selection**, not only the artboard.
2. Faithful SVG export: gradients, images, wrapped text, paths, opacity, blend.
3. Image crop + rectangular mask.
4. Manual guides + rulers (drag from edge, snap while moving).
5. History panel (clickable undo stack).
6. Pen tool: undo last point, close path, Escape to finish.
7. Print / story safe-area overlay + optional bleed on export.
8. Hub folders / tags for recents; pin a project.
9. Brand kit: named colours + font pairing applied to new text.
10. Magic layout: replace-board vs append; structured JSON schema; preview before apply.
11. Paint stroke undo (not the whole bitmap commit).
12. Mobile studio: tool overflow menu, export always reachable, inspector sheets.
13. Contrast checker on text vs fill / artboard.
14. Multi-page / artboard set for a campaign (story + square + banner).
15. PDF-quality export (vector-ish or high-DPI print PNG with crop marks).
16. Components / linked duplicates (edit one, update copies).
17. Color-from-image palette into the brand kit.
18. Present mode speaker notes / click-through frames.
19. Performance: thumbnail cache, paint layer dirty-rect, fewer store redraws.

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
- Layers panel: drag-to-reorder via grip handle (native DnD); ↑↓ still available.

## Iterations

### 2026-08-22 — loop 0 (manual)

Command palette, marquee, smart guides, clipboard, present, context menu, zoom HUD, inspector depth, hub search/duplicate, four new templates. Typecheck + production build + smoke clean.

### 2026-08-22 — loop 1

Layer drag-to-reorder in the layers list. Grip handle + drop highlight; `reorderToIndex` in store; z-order maps correctly (top of list = top of stack). Typecheck, production build, and browser smoke clean. Leftover: no multi-select drag reorder; insert position is “take target’s slot” not mid-gap.

## Next recommended

Selection-relative align / distribute.
