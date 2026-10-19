## Iteration

2026-10-20 00:03 BST — Refactored the move-count seating so a single loop steps the caption off any number of overlapping stay stamps (up to 64) instead of an unrolled chain of 47 ifs. Stamp alpha unchanged. Esc still clears it early.

## Done

- Replaced the 47-step unrolled stamp-clear chain in stepCountOffStayStampAndCropEdgeWhenBothSidesBlockedByWideLead with a while loop that keeps stepping one caption-height off the current overlapping stay stamp until the count is clear or no further progress is possible.
- Handles the previous forty-seventh case and any deeper stack of stay stamps without further copy-paste.
- Earlier caption-width step preference, vertical drops, slide, and one-caption tuck remain.

## Backlog

- Consider extracting the shared stamp-overlap test into a small helper if more seating paths grow similar loops.

## Next recommended

Consider extracting the shared stamp-overlap test into a small helper if more seating paths grow similar loops.
