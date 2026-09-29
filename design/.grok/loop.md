# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 11:15 BST — Isolate can switch targets. Show all / Esc restore the snapshot; Alt-click or Cmd+2 on another set restores first then isolates the new keep. SVG export entities compile.

## Next recommended

Present peek chrome tests still expect older hairline class names.

## Done

- applyIsolate empty keepIds = Show all; same keep toggles off; different keep switches from snapshot.
- Layers Show all calls toggleIsolate([]). Isolating N count.
- Escape exits isolate. Cmd+2 isolates selection.
- Command palette: Isolate selection / Show all layers.
- export.ts esc() writes real XML entities.
- store-impl.placeNodes typed as { id, x, y }[].
