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

1. Pen tool: Option/Alt after release to convert the last point to a corner.
2. Pen tool: live close preview while dragging the last handle toward the first point.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Mixed type size / weight when two or more text layers are selected.
- Mixed type family / tracking / leading / align when two or more text layers are selected.
- NumField supports mixed placeholder (em dash) and blur / Enter / Escape.
- Store types `booleanPreview` and `fit-sel` view intent; canvas fits the selection box.
- Inspector type size / weight use NumField drafts on the single-select pane.
- Inspector tracking / leading drafts sit beside the sliders; typed weight snaps to the nearest 100.
- Inspector X/Y/W/H use NumField drafts so geometry does not commit mid-keystroke.
- Mixed-type tracking / leading sliders sit beside the draft fields; drag writes onto every selected text layer.
- Inspector rotation / stroke width use NumField drafts; full Zustand store restored so the studio hydrates.
- Mixed-type size / weight sliders sit beside the draft fields; drag writes onto every selected text layer. Zustand store restored (~29kb) so hydrate, history, and tools work.
- Inspector type size / weight / tracking / leading use NumField drafts plus sliders on the single-select pane. Zustand store restored (~29kb) with hydrate, history, booleanPreview, and fit-sel.
- Inspector opacity / corner radius / image filter use NumField drafts; missing ImageFields / hotspot / link row restored. Zustand store implementation restored (~29kb).
- Path inspector pane: point list with X/Y drafts, close/open, smooth/corner, delete point. Zustand store implementation restored (~29kb).
- Image filters (brightness / contrast / saturate / blur) and source crop apply in the canvas renderer and PNG/JPG export. Zustand store implementation restored (~29kb).
- Pen click-drag pulls mirrored cubic handles while drawing; click without drag stays a corner. Zustand store implementation restored (~29kb).
- Pen Alt-drag breaks a handle while drawing (sticky corner). Zustand store implementation restored (~29kb).
- Pen click on the first point closes with a last→first cubic. Rubber-band previews that close. Zustand store implementation restored (~29kb).

## Iterations

### 2026-08-31T22:25Z — loop 98

**Pen close on first point.** With three or more anchors, click the first square to close. The last→first segment is written as a cubic (outgoing handle on the last point, incoming on the first). Hovering the first point draws the closing cubic and a phosphor ring. Enter still closes. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T22:10Z — loop 97

**Pen Alt-break while drawing.** Hold Alt as you drag a new pen point (or press Alt mid-drag) and the outgoing handle leaves the incoming one behind — a corner instead of a smooth pair. The artboard hint names Alt break. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T20:10Z — loop 96

**Pen click-drag cubics.** Pen still clicks to drop an anchor. Drag before release pulls mirrored in/out handles so the next segment is a cubic; a short click stays a corner. Rubber-band preview follows the cursor. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T18:22Z — loop 95

**Live image filters on the artboard.** Image layers now preview inspector brightness, contrast, saturate, and blur through the canvas `filter` pipeline. Normalized crop rectangles sample the source bitmap. PNG/JPG export uses the same renderer. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T10:30Z — loop 94

**Path inspector + store restore.** Select a pen path: Inspect grows a Path pane with a numbered point list. Type local X/Y and Enter to move an anchor; Smooth writes cubic handles, Corner clears them; Close/Open toggles the contour (needs three points). Click a point row to mark it active. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T08:20Z — loop 93

**Opacity / radius / image-filter drafts + store restore.** Select a layer: Opacity keeps the slider and gains a percent draft (0–100). Rects gain a corner-radius draft beside the slider. Image layers expose Brightness, Contrast, Saturate, and Blur with sliders plus typed fields — Enter or click away commits; Escape restores the live figure. Restored the truncated Zustand store (~29kb) and the missing inspect helpers (contrast meter, linked instances, present hotspot, image crop) so the studio hydrates and typechecks again.

### 2026-08-31T07:31Z — loop 92

**Single-select type drafts + store restore.** Select one text layer: Size, Weight, Tracking, and Leading keep their phosphor sliders and gain draft fields. Type a figure, Enter or click away to commit; Escape restores the live value. Weight snaps to the nearest 100. Restored the truncated Zustand store (~29kb) with `booleanPreview`, `pathEditHit`, and `fit-sel` so the studio hydrates again.

## Next recommended

Pen tool: Option/Alt after release to convert the last point to a corner.
