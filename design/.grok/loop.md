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

1. Eyedropper samples from images and paint, not just the flattened canvas.
2. Present hotspot outline on hover.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Layer drag, selection-relative align, faithful SVG, image crop + mask.
- Rulers + manual guides (labels, cursor, double-click delete).
- History panel: clickable undo stack under Layers (Now / Step N / Redo).
- Pen: last point, Enter or click first point to close, Esc / double-click to finish. Rubber-band preview.
- Safe area overlay (story/print-aware) + bleed on PNG/JPG with crop marks.
- Pin projects in Recents (persisted, sort pinned first, phosphor accent).
- Hub folders + Campaign/Draft/Press tags on recents.
- Brand kit: named colours + display/body font pairing applied to new text.
- Magic layout: Append/Replace, schema-validated nodes, preview then Apply/Discard.
- Paint stroke undo: ⌘Z pops the last brush/eraser stroke without cloning the whole document.
- Mobile studio: tool overflow, always-on Export, inspector as a bottom sheet.
- Contrast checker: WCAG ratio on text vs overlapping fill or artboard, with Fix.
- Campaign set: story + square + banner pages, magic-scaled from the current board.
- Campaign clone uses uniform contain scale + center (no stretch) for cleaner format variants.
- Print export: 4× PNG + one-page PDF with crop marks.
- Linked duplicates: style/copy sync across instances; transform stays local.
- Palette from image: hub “From image” and inspector “Palette to brand”.
- Present mode: speaker notes + campaign click-through (← → / space / frame chips).
- Paint live: stroke draws offscreen; PNG encode only on pointer-up. Canvas skips brand/index/brush redraws.
- Hotspots: a layer can jump to another campaign page or a URL in present.
- Thumbnail cache: content hash on artboard+nodes skips re-raster when hub thumbnail is still valid.
- Present hotspot cursor: pointer + phosphor target name on hover.
- Hub recents: Set · N chip on campaign cards; Sets filter.

## Iterations

### 2026-08-23T02:03Z — loop 28

Campaign set chips on Recents. Typecheck + build + smoke clean.

### 2026-08-23T01:58Z — loop 27

Present hotspot cursor hint. Typecheck + build + smoke clean.

### 2026-08-23T01:07Z — loop 26

Thumbnail cache for hub recents. `thumbHash` (FNV-1a of artboard+nodes) stored on the document; save reuses the existing PNG data URL when the hash matches. Typecheck + build + smoke clean.

### 2026-08-23T00:28Z — loop 25

Present hotspots. Inspector Hotspot → campaign page or URL. Click hits the layer first, else next frame. Typecheck + build + smoke clean.

### 2026-08-23T00:18Z — loop 24

Smoother brush: no per-dab store writes. Typecheck + build + smoke clean.

### 2026-08-23T00:20Z — loop 23

Present speaker notes + deck nav. Inspector notes field; Present shows notes rail and advances campaign pages with keys or click. Typecheck + build + smoke clean.

### 2026-08-23T00:08Z — loop 22

Sample an image into named brand swatches. Typecheck + build + smoke clean.

## Next recommended

Eyedropper samples from images and paint, not just the flattened canvas.
