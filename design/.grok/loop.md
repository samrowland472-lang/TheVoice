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

1. Inspector mixed-value treatment for remaining type fields when multi-select includes both type and shapes (family / size / weight still live only under 2+ type layers).

## Done

- Mixed type colour when the selection mixes type and shapes: dash hex if type fills disagree; picker, brand swatch, or Apply key type colour writes fill onto type layers only so shapes keep their own ink.

- Mixed fill/stroke colour pickers: dash hex when the selection disagrees; picking a colour, a brand swatch, or Apply key … to all writes onto every selected layer. Stroke width uses the same mixed NumField.

- Inspector Key fields (name, X/Y/W/H, rotate, radius): multi-select shows a dash when values disagree; editing applies to every selected layer.

- Layer filter field above the stack. Matches name or kind (case-insensitive). Count + clear. Drag-reorder disabled while filtered so drop indices stay honest.

- History list labels: undo stack records action names (Delete, Move, Type, Add Rectangle, …) and the Layers History list shows them instead of “Step N / Redo N”. Clicking a named step restores that snapshot and rewinds/fast-forwards the stack.

- Double-click a layer name in the Layers panel to rename it. Enter commits, Escape cancels, blur commits a trimmed name. Empty names are ignored.

- Path inspector wrap-off helpers folded onto shared `path-point-tab-b` (`snapshotList`, `holdListScroll`, `focusHoldEl`, `focusHold`, `holdExitHop`).

## Iteration

2026-09-14 21:20 BST — Mixed type colour for type+shape selections (type-only write).

## Next recommended

Inspector mixed-value treatment for remaining type fields when multi-select includes both type and shapes (family / size / weight still live only under 2+ type layers).
