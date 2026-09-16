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

1. Per-kind width chips that stamp one outline’s stroke width onto the rest of a mixed pick.
2. Mixed-kind dash preview on the canvas itself (ghost dash overlay while hovering a rhythm chip).

## Done

- Per-kind dash / cap / join preview chips: when a mixed outline pick disagrees on dash, cap, or join, each selected path/rect/ellipse/line/polygon/star/arrow shows chips plus a combined rhythm chip. Clicking stamps that outline’s dash, cap, and/or join onto every outline in the pick. Offset and miter chips still stamp those fields. Sides write onto polygons/stars only; head scale onto arrows only. Arrows paint and export as heads (`headScale`).

- Mixed dash-offset + miter preview chips: when a mixed outline pick disagrees on offset or miter, each selected path/rect/ellipse/line/polygon/star/arrow shows a chip; clicking stamps that outline’s offset or miter onto the rest. Sides still write onto polygons/stars only; head scale onto arrows only. Arrows paint and export as heads.

- Arrow / polygon / star stroke chips: Sides sliders + chips write onto polygons and stars only; Head scale sliders + chips write onto arrows only. Shared dash / cap / join / offset / miter stay on the Stroke inspector. Arrows paint and export as heads (headScale), not rounded rects.

- Mixed dash offset + miter on mixed-kind outline picks: Stroke inspector now lists every selected path, rectangle, ellipse, line, polygon, star, and arrow. Offset and Miter sliders dash when values disagree, write onto all outline ids, paint via lineDashOffset + miterLimit, and export stroke-dashoffset / stroke-miterlimit with cap, join, and dasharray.

- Mixed dash + cap + join on non-path strokes: rects, ellipses, and lines share the Stroke inspector with paths. Dash / cap / join / offset / miter write onto every selected outline, paint via setLineDash + lineCap/lineJoin/miterLimit, and export stroke-dasharray / stroke-linecap / stroke-linejoin / stroke-dashoffset / stroke-miterlimit.

- Mixed stroke width + dash offset on dashed multi-path picks: Width and Offset sliders dash when path values disagree, write onto path ids only, paint lineWidth / setLineDash / lineDashOffset, and export stroke-width + stroke-dashoffset with cap/join/miter/dasharray.

- Mixed miter limit on dashed multi-path picks: Miter slider appears when join is miter or joins disagree, dashes when limits disagree, writes onto path ids only, paints ctx.miterLimit, and exports stroke-miterlimit with cap/join/dasharray.

- Mixed line-cap / join when dashed paths sit in a mixed-kind pick: cap and join menus dash when path values disagree, write onto path ids only, paint with canvas lineCap/lineJoin, and export stroke-linecap / stroke-linejoin with dasharray.

- Present-mode speaker-note overlay: notes float over the artboard as a phosphor card, stay editable, toggle with N / Notes on (persisted in localStorage), Escape exits present, and Prev/Next live in the present bar so campaign paging no longer shares the notes strip.

- Mixed radius + path stroke dash on mixed-kind multi-select: Radius writes onto rects only (dash when radii disagree); Dash slider writes onto paths only, renders and exports stroke-dasharray, and dashes when path dash lengths disagree.

- Mixed shadow inspector on multi-select (including mixed kinds): Key Shadow editor stays visible, dashes / dim sliders when colour, blur, offset, spread, or inset disagree, and Add/Clear plus field drags write onto every selected id.

- Mixed opacity / blend on multi-select: dash + dim slider when values disagree; range, percent field, and blend menu write onto every selected id, including mixed kinds.

- Mixed type family / size / weight / tracking / leading / align when the selection mixes type and shapes: Type panel appears with one or more text layers (not only 2+ type), writes onto type ids only, and hides the key type sliders so family and size stay in one place.

- Mixed type colour when the selection mixes type and shapes: dash hex if type fills disagree; picker, brand swatch, or Apply key type colour writes fill onto type layers only so shapes keep their own ink.

- Mixed fill/stroke colour pickers: dash hex when the selection disagrees; picking a colour, a brand swatch, or Apply key … to all writes onto every selected layer. Stroke width uses the same mixed NumField.

- Inspector Key fields (name, X/Y/W/H, rotate, radius): multi-select shows a dash when values disagree; editing applies to every selected layer.

- Layer filter field above the stack. Matches name or kind (case-insensitive). Count + clear. Drag-reorder disabled while filtered so drop indices stay honest.

- History list labels: undo stack records action names (Delete, Move, Type, Add Rectangle, …) and the Layers History list shows them instead of “Step N / Redo N”. Clicking a named step restores that snapshot and rewinds/fast-forwards the stack.

- Double-click a layer name in the Layers panel to rename it. Enter commits, Escape cancels, blur commits a trimmed name. Empty names are ignored.

- Path inspector wrap-off helpers folded onto shared `path-point-tab-b` (`snapshotList`, `holdListScroll`, `focusHoldEl`, `focusHold`, `holdExitHop`).

## Iteration

2026-09-16 09:10 BST — Per-kind dash / cap / join unify chips on mixed outline picks.

## Next recommended

Per-kind width chips that stamp one outline’s stroke width onto the rest of a mixed pick.
