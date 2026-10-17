## Iteration

2026-10-17 07:05 BST — When the one-more caption-height step still lands on a second stay stamp, the move-count seating steps one more caption-height off that second stamp so the count stays readable. Stamp alpha unchanged. Esc still clears it early.

## Done

- stepCountOffStayStampAndCropEdgeWhenBothSidesBlockedByWideLead now steps one more caption-height off a second overlapping stay stamp when the first step still covers one.
- Called from the multi-line ends-blocked path in seatWrappedCommitCaption after the drop, so the tucked move-count stays off stay stamps even after the opposite-side try and first step fail.
- Earlier one-step stamp clear, caption-width step preference, vertical drops, slide, and one-caption tuck remain.

## Backlog

- Keep the move-count seating readable when the second caption-height step still lands on a third stay stamp, by stepping one more caption-height off that third stamp.

## Next recommended

Keep the move-count seating readable when the second caption-height step still lands on a third stay stamp, by stepping one more caption-height off that third stamp.
