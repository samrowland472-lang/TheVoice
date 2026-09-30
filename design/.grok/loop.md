# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 02:05 BST — Present stack wrap-pending lasts only until the next non-wrap advance. `campaignStackAdvance` drives `go()` (ArrowUp/Down wrap last→first). Peek tick dwell uses `peekTickDwellAcrossWrap` / `peekTickDwellAfterNotesClose` so notes-open wrap keeps remaining, then a mid-stack step drops wrap-pending. Fixed broken `esc()` in export.ts.

## Next recommended

Raster a three-board campaign PDF in the browser smoke and assert `/Type /Page` count. Restore notes caret when jumping frames after wrap.

## Done

- peekWrapPendingAfterAdvance(wrapped) → true; next non-wrap → false.
- campaignStackAdvance reports wrapped for last→first / first→last.
- Present go() uses campaignStackAdvance; ArrowUp/Down flip the stack.
- peekTickDwellAfterNotesClose resumes remaining when notes close after wrap.
- peekTickDwellAcrossWrap keeps dwell when notesVisible && wrap-pending.
- Fixed esc() HTML entities in export.ts.
- placeNodes typed so typecheck is clean.
