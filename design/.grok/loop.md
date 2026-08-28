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

1. Concave / compound-path boolean (full Greiner–Hormann, not hull fallback).
2. Rotation-aware boolean polish on already-holed path nodes.
3. Inspector: hole count + fill-rule control on combined paths.

## Done

- Hub, studio chrome, canvas tools, inspector, present, export PNG/JPG/SVG.
- Canvas stage restored; eyedropper HUD under the board.
- Zoom to selection: Shift+0, command palette, context menu.
- Boolean ops: subtract punches evenodd holes from true intersection clip; union clusters overlapping shapes via hull; multi-cutter holes share base origin.
- Combine UI: Union / Subtract in context menu + command palette (disabled when ineligible).
- PathNode holes[] + fillRule; render + SVG export multi-contour.

## Iterations

### 2026-08-28T19:10Z — loop 51

**Restore wiped canvas + true polygon clip.** canvas-stage, studio-app, export, and viewport-aware render restored from Design history (placeholders were 12–13 bytes). Boolean subtract now clips cutter ∩ base (Sutherland–Hodgman when a contour is convex) so holes share the base origin; multi-cutter subtract stacks those intersection rings. Union clusters overlapping contours and hulls the merge. Context menu + command palette Union/Subtract; Shift+0 zoom-to-selection. SVG export writes holes + fill-rule. Typecheck + build + browser-smoke clean.

### 2026-08-28T07:20Z — loop 50

**Restore canvas-stage + wire boolean end-to-end.** Restored wiped canvas-stage (35KB) and full studio-app from history. PathNode gains holes[] + fillRule; render fills multi-contour with evenodd/nonzero; SVG export emits holes + fill-rule. Store: canBooleanSelected, booleanUnionSelected, booleanSubtractSelected (multi-cutter holes). Context menu Union/Subtract (disabled when ineligible); command palette Arrange group. Inspector shows path point/hole count + fill-rule control. requestFitSelection (Shift+0) + fitBoxViewport. Typecheck + build + browser-smoke clean.

### 2026-08-28T04:15Z — loop 49

**Boolean ops + combine UI polish.** Restored wiped canvas-stage + studio-app. PathNode gains holes[] + fillRule; render fills with evenodd/nonzero multi-contour. boolean-ops.ts: isBooleanable, nodeToWorldPolygon (rotation baked), unionShapes, subtractShapes. Store: canBooleanSelected, booleanUnionSelected, booleanSubtractSelected. Context menu greys out Union/Subtract when selection cannot boolean; command palette Arrange group. requestFitSelection + fitBoxViewport wired. Typecheck + build + browser-smoke clean.

### 2026-08-27T07:30Z — loop 48

**Boolean ops (holes / evenodd multi-contour).** Restored wiped canvas-stage + studio-app from history; added requestFitSelection. PathNode gains holes[] + fillRule; render fills with evenodd. boolean-ops.ts: nodeToLocalPolygon, subtractShapes (outer+hole), unionShapes (multi-contour nonzero). Store: booleanUnionSelected / booleanSubtractSelected. UI: context menu + command palette. Typecheck + build clean.

### 2026-08-26T21:30Z — loop 47

**Selection tools polish.** Marquee, nudge pulse, fit/export selection wiring.

## Next recommended

Concave compound-path clip (Greiner–Hormann) and inspector hole/fill-rule controls.
