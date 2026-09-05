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

1. Inspector mixed shadow sliders that stay live while colour and offset chips disagree — ghost the first drop without writing it onto the pick.

## Done

- Inspector mixed shadow colour / blur: chips name hex and `b28` when those fields disagree; a chip stamps only colour or only blur onto every selected drop. Colour picker and blur slider write through per field so ox / oy stay put.

- Inspector mixed shadow offsets: chips name `ox 8` / `oy 18` when those axes disagree; a chip stamps only that offset onto every selected drop. Sliders write colour, blur, ox, and oy through per field.

- Inspector mixed lock / visibility: chips name `shown` / `hidden` and `locked` / `open` when the pick disagrees; a chip stamps that layer’s flag onto the whole pick. Show all / Hide all / Lock all / Unlock all write through.

- Inspector mixed opacity / blend: chips name `72%` and `multiply` when those values disagree; a chip stamps that layer’s opacity or blend onto the whole pick. Labeled fill / stroke chips now stamp cloned fill and named stroke.
- Inspector mixed radius / rotation: sliders write angle and corner onto every selected layer; chips name `12°` / `r 24` when values disagree and stamp that layer’s value on the pick.
- Boolean apply on three-plus picks explodes every island after commit. Union / subtract / intersect / exclude leave each resulting contour as its own path at its world box; the pick becomes those islands. Hover preview ghosts the same set.
- Inspector mixed fill / stroke: chips name each layer’s fill (hex or `grad angle · a→b`) and stroke (`hex · width` or none). A chip clones that fill or stamps that stroke + width onto the whole pick.
- Boolean preview ghosts every island from three-plus picks (union / subtract / intersect / exclude), not only the first compound.
- Knife on primitives: rect, ellipse, polygon, star, arrow, and line convert in place when the knife stroke or click hits them. Preview marks the same converted contour. Existing path / figure-eight cuts stay as they were.
- Inspector mixed wonk: Fraunces exposes Wonk (`WONK` 0–1); multi-select writes only onto faces that expose it; Unwonk clears the lock. Chips name `WONK` when values disagree. Variation settings ride the artboard, outline, and SVG export.
- Inspector mixed grade / softness: Roboto Flex exposes Grade (`GRAD`), Fraunces exposes Softness (`SOFT`); multi-select writes only onto faces that support the axis; Default grade / Sharp clear the lock. Chips name `GRAD` / `SOFT` when those axes disagree. Variation settings ride the artboard, outline, and SVG export.
- Inspector mixed italic / slant: Inter exposes Slant (`slnt`), Newsreader exposes Italic (`ital`); multi-select writes only onto faces that support the axis; Upright / Roman clear the lock. Chips name `slnt` / `ital` when those axes disagree. Variation settings ride the artboard, outline, and SVG export.
- Type chips label optical size / width when those axes differ across the selection (opsz auto vs locked, wdth values).
- Type-to-path, PNG raster, and SVG export honor opsz / wdth via the same variation settings as the artboard. SVG writes `font-variation-settings`, weight, tracking, and anchor.
- Inspector mixed type optical size / width: Fraunces shows Optical (auto from size or locked), Instrument Sans shows Width; multi-select writes only onto faces that support the axis; Auto from size clears the lock.
- Inspector mixed type write-through: family, weight, tracking, leading, align, and uppercase write onto every selected text layer.

## Iterations

### 2026-09-05T09:15Z — loop 166

**Mixed shadow colour / blur chips.** Shift-pick two layers whose drops share offset but not colour or blur. Inspector chips read the hex and `b28`. Tap a colour chip — every selected drop takes that colour and keeps its own ox / oy / blur.

### 2026-09-05T07:20Z — loop 165

**Mixed shadow offset chips.** Shift-pick two layers whose drops share colour and blur but not offset. Inspector chips read `ox 8` and `oy 18`. Tap an ox chip — every selected drop takes that X and keeps its own Y.

### 2026-09-05T05:10Z — loop 164

**Mixed lock / visibility chips.** Shift-pick two layers where one is hidden or locked. Inspector chips read `shown` / `hidden` and `locked` / `open`. Tap a chip — the whole pick takes that flag. Show all and Unlock all write through.

## Next recommended

Inspector mixed shadow sliders that stay live while colour and offset chips disagree — ghost the first drop without writing it onto the pick.
