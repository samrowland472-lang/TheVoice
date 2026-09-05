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

1. Inspector mixed shadow offset chips that name `ox` / `oy` independently when only offset disagrees.

## Done

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

### 2026-09-05T05:10Z — loop 164

**Mixed lock / visibility chips.** Shift-pick two layers where one is hidden or locked. Inspector chips read `shown` / `hidden` and `locked` / `open`. Tap a chip — the whole pick takes that flag. Show all and Unlock all write through.

### 2026-09-05T04:18Z — loop 163

**Mixed opacity / blend chips.** Shift-pick two shapes with different opacity or blend. Inspector chips read `72%` and `multiply`. Tap a chip — the whole pick takes that opacity or blend. Fill and stroke chips now name the value they stamp.

### 2026-09-05T02:11Z — loop 162

**Mixed radius / rotation.** Shift-pick two shapes with different angles or corner radii. Geometry chips read `12°` and `r 24`. Tap a chip — the whole pick takes that rotation or radius.

### 2026-09-05T01:26Z — loop 161

**Boolean apply, all islands.** Shift-pick three or more shapes, hover Union / Subtract / Intersect / Exclude, then commit. Every resulting island stays on the artboard as its own path. Move one — the others hold their place.

### 2026-09-05T01:15Z — loop 160

**Mixed fill / stroke chips.** Shift-pick two shapes with different fills or strokes. Inspector chips read the hex (or gradient) and the stroke weight. Tap a chip to stamp that ink on every selected layer.

### 2026-09-04T23:25Z — loop 159

**Boolean preview, all islands.** Hover Union / Subtract / Intersect / Exclude with three or more shapes. Every resulting island draws on the artboard, not just the first.

### 2026-09-04T23:10Z — loop 158

**Knife on shapes.** Draw a rectangle or ellipse, pick Knife (K), drag across the silhouette. The shape becomes a path and opens along the stroke. Hover and stroke marks follow the same contour.

### 2026-09-04T22:05Z — loop 157

**Wonk axis.** Fraunces adds Wonk. Mixed picks write `WONK` only onto faces that expose it. Chips read `Fraunces 48 · WONK 1` next to a sharp sibling. Unwonk returns the face to the default.

### 2026-09-04T19:20Z — loop 156

**Grade and softness axes.** Roboto Flex adds Grade, Fraunces adds Softness. Mixed picks write `GRAD` / `SOFT` only onto faces that expose them. Chips read `Flex 48 · GRAD 80` next to `Fraunces 48 · SOFT 40`.

### 2026-09-04T13:15Z — loop 155

**Slant and italic axes.** Inter adds Slant, Newsreader exposes Italic. Mixed picks write `slnt` / `ital` only onto faces that expose them. Chips read `Inter 48 · slnt -8` next to `Newsreader 48 · ital 1`.

### 2026-09-04T12:35Z — loop 154

**Axis chips.** Mixed type chips now name opsz / wdth when those axes disagree across the pick. Two Fraunces layers with different optical sizes read as `Fraunces 48 · opsz 36` and `Fraunces 48 · opsz auto`; Instrument width mismatches show `wdth`.

### 2026-09-04T09:35Z — loop 153

**Axes on press.** Optical size and width now ride through outline conversion and export. Convert type to path or download PNG/SVG after locking opsz on Fraunces or wdth on Instrument Sans — the cut and the file keep the axis.

### 2026-09-04T08:30Z — loop 152

**Mixed type axes.** Pick Fraunces for Optical size, Instrument Sans for Width.

## Next recommended

Inspector mixed shadow offset chips that name ox / oy independently when only offset disagrees.
