## Iteration

2026-10-17 05:15 BST — When both sides are blocked by wide leads on a multi-line release, the move-count seating now steps off the stay stamps and crop edges. It prefers the just-beside seat closest to the count; if that seat still covers a stamp or lands on a crop edge, it tries the opposite side before accepting an edge seat. Stamp alpha unchanged. Esc still clears it early.

## Done

- stepCountOffStayStampAndCropEdgeWhenBothSidesBlockedByWideLead prefers the inward beside-lead seat that clears stamps, the lead, and crop edges, falling back to the opposite side.
- Called from the multi-line ends-blocked path in seatWrappedCommitCaption after the drop, so the tucked move-count stays off stay stamps and crop edges when wide leads block both sides.
- Earlier caption-width step preference, vertical drops, slide, and one-caption tuck remain.

## Backlog

- Keep the move-count seating readable when the preferred beside-lead seats still land on a stay stamp after the opposite-side try, by stepping one more caption-height off the stamp row.

## Next recommended

Keep the move-count seating readable when the preferred beside-lead seats still land on a stay stamp after the opposite-side try, by stepping one more caption-height off the stamp row.
