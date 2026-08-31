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

1. Inspector rotation / stroke width use NumField drafts.
2. Mixed-type size / weight sliders beside the draft fields.

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

## Iterations

### 2026-08-31T05:25Z — loop 89

**Mixed tracking / leading sliders.** Shift-select two text layers: Tracking and Leading now keep the draft field and gain a phosphor slider. Drag sets letter-spacing or line-height on every selected text layer; type a figure and Enter or click away to commit. Differing values still show Mixed and an em dash until you set one. Restored the truncated Zustand store so the studio hydrates again.

### 2026-08-31T05:10Z — loop 88

**Geometry drafts.** Select a layer and Inspect X, Y, W, H no longer commit on every keystroke. Type a figure, press Enter or click away; Escape restores the live value. Width and height clamp to 1 so a layer cannot collapse to zero while you type.

### 2026-08-31T04:20Z — loop 87

**Tracking / leading drafts.** Select one text layer: Tracking and Leading keep their sliders and gain a draft field. Type a value, Enter or click away to commit; Escape restores the live figure. Size and weight use the same draft pattern; typed weight snaps to the nearest hundred and the field shows that weight at once. Mixed selection weight drafts snap the same way.

### 2026-08-31T03:15Z — loop 86

**Single-select type drafts.** Select one text layer and Inspect size / weight no longer commit on every keystroke. Type a point size, press Enter or click away; Escape restores the live value. Weight is typed the same way and snaps to the nearest hundred on commit.

### 2026-08-31T01:10Z — loop 85

**Mixed type family, tracking, leading, align.** Shift-select two text layers and the Type pane now sets family, tracking, leading and paragraph align across the set. Differing values show Mixed or an em dash; Display / Body still apply the brand pairing to every selected text layer.

### 2026-08-31T00:30Z — loop 84

**Mixed type size and weight.** Shift-select two text layers and the inspector grows a Type pane. Differing sizes show an em dash; type a point size and Enter writes it onto every selected text layer. Weight does the same from the Mixed menu. Single-select copy still lives in Inspect.

## Next recommended

Inspector rotation / stroke width use NumField drafts.
