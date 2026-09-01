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

1. Pen join preview ring when two open ends are within the snap distance.
2. Knife / cut path at a clicked segment.

## Done

- Pen: double-click a corner to auto-smooth; snap two open path ends together to join (9px ring). Zustand store implementation restored (~29kb).
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
- Pen click on the first point closes with a last\u2192first cubic. Rubber-band previews that close. Zustand store implementation restored (~29kb).
- Pen Alt after release corners the last point (drops the outgoing handle). Zustand store implementation restored (~29kb).
- Pen live close preview while dragging the last outgoing handle toward the first point. Release inside the snap ring closes with a last→first cubic. Zustand store implementation restored (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.
- Pen snap-close uses a 9px ring shared with first-point click. Handle-drag then snap-close is one undo. Close writes last→first cubics. Zustand store implementation restored (~29kb).

## Iterations

### 2026-09-01T03:30Z — loop 102

**Pen join + double-click smooth.** Drag or click one open path end onto another (same or other contour) to join within a 9px snap ring. Double-click a corner anchor to auto-smooth mirrored handles. Close uses `closePathWithCubic` and stays selected. Zustand store implementation restored (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-09-01T03:10Z — loop 101

**Pen snap-close threshold + one undo.** Snap ring is 9 screen pixels (shared helper with first-point click). Releasing the last outgoing handle inside the ring closes with `closePathWithCubic` without a second history snapshot, so one Undo restores the open contour. Zustand store implementation restored (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-09-01T01:40Z — loop 100

**Pen live close preview on last-handle drag.** With three or more anchors, dragging the last point’s outgoing handle toward the first square draws the closing cubic and a phosphor ring. Release inside the ring commits `closePathWithCubic` (incoming handle on the first point, outgoing on the last). Hovering the first point still previews the same close. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T23:26Z — loop 99

**Pen Alt-after-drop corners last.** After placing a pen point (click or click-drag), tap Option/Alt to convert that last anchor to a corner — outgoing handle drops so the next segment starts sharp. Incoming curve stays. The artboard hint names it. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

### 2026-08-31T22:25Z — loop 98

**Pen close on first point.** With three or more anchors, click the first square to close. The last\u2192first segment is written as a cubic (outgoing handle on the last point, incoming on the first). Hovering the first point draws the closing cubic and a phosphor ring. Enter still closes. Restored the truncated Zustand store (~29kb) with hydrate, history, `booleanPreview`, `pathEditHit`, and `fit-sel`.

## Next recommended

Pen join preview ring when two open ends are within the snap distance.
