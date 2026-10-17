## Iteration

2026-10-17 06:05 BST — When preferred beside-lead seats still land on a stay stamp after the opposite-side try, the move-count seating steps one more caption-height off the stamp row so the count stays readable. Stamp alpha unchanged. Esc still clears it early.

## Done

- stepCountOffStayStampAndCropEdgeWhenBothSidesBlockedByWideLead now steps one more caption-height off the overlapping stay stamp when both preferred and opposite seats still cover a stamp.
- Called from the multi-line ends-blocked path in seatWrappedCommitCaption after the drop, so the tucked move-count stays off stay stamps even after the opposite-side try fails.
- Earlier caption-width step preference, vertical drops, slide, and one-caption tuck remain.

## Backlog

- Keep the move-count seating readable when the one-more caption-height step still lands on a second stay stamp, by stepping one more caption-height off that second stamp.

## Next recommended

Keep the move-count seating readable when the one-more caption-height step still lands on a second stay stamp, by stepping one more caption-height off that second stamp.
