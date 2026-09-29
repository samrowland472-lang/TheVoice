# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 16:10 BST — Present notes drawer is mounted again. Jump to last-edited frame restores the caret while the field stays focused. Peek strip ticks, scrub, and double-click notes are back on the artboard.

## Next recommended

Campaign PDF stack smoke in Present. Fade peek ticks with PEEK_TICK_FADE_MS instead of a constant remaining of 1.

## Done

- PresentNotesPanel wired into PresentView; notes persist per frame.
- restoreCaretIfFocused runs on live frame change without a second focus tick.
- Peek strip `data-present-peek` with phosphor tick, scrub, named caption, double-click notes.
- export.ts esc() writes amp/lt/gt/quot entities.
- Jump chip still reads last-edited page from localStorage.
