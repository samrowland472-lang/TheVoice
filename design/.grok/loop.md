# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 15:10 BST — Present speaker notes drawer is back. Caret and last-edit jump persist in localStorage when you flip frames. Peek strip ticks return when chrome idles. SVG esc() entities and placeNodes typing stay fixed.

## Next recommended

Campaign PDF stack smoke in Present. Restore selection after jump lands on the last-edited frame without a second focus tick.

## Done

- Notes drawer textarea + PresentNotesJump chip in Present.
- Caret map written on select/change; clamp + restore on focus and frame change.
- Peek strip `data-present-peek` with phosphor live tick and double-click notes.
- export.ts esc() writes amp/lt/gt/quot entities.
- store-impl.placeNodes typed as { id, x, y }[].
- PresentNotesJump reads last-edited page from localStorage and jumps without leaving Present.
