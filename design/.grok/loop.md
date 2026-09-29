# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 14:10 BST — Present notes jump chip is live in the peek drawer. Edit notes on one frame, flip to another, open notes (N or double-click peek) and jump back. Peek strip + phosphor hairline restored. SVG esc() and placeNodes typing repaired.

## Next recommended

Campaign PDF stack smoke in Present. Caret restore in the notes drawer when jumping frames.

## Done

- PresentNotesJump reads last-edited page from localStorage and jumps without leaving Present.
- Notes edits write LastNotesEdit { pageId, name, at }.
- Peek drawer: data-present-peek, scrub ticks, Shift names, double-click quiet notes, Escape closes notes first.
- export.ts esc() writes amp/lt/gt/quot entities.
- store-impl.placeNodes typed as { id, x, y }[].
