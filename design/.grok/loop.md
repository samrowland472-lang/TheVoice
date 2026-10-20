## Iteration

2026-10-20 04:05 BST — Extracted a shared centerRectsOverlap helper for the move-count seating paths so stamp, lead, and avoid tests share one implementation instead of repeated spansOverlap pairs. Seating behaviour unchanged. Esc still clears early.

## Done

- Added centerRectsOverlap next to spansOverlap for axis-aligned center-based boxes.
- Replaced the duplicated stamp/lead/avoid overlap tests in stepCountOffStayStampAndCropEdgeWhenBothSidesBlockedByWideLead, nudgeSlidCountClearOfStayStamp, tuckCountOneCaptionWidthOffEdgeBesideLead, stepCountOneMoreCaptionWidthOffEdgeBesideLead, and the two hitsAvoid sites.
- Stamp alpha, caption-height steps, and crop-edge clamps remain as before.

## Backlog

- Consider collapsing the long unrolled comment blocks on the seating functions once the loop form is stable.

## Next recommended

Consider collapsing the long unrolled comment blocks on the seating functions once the loop form is stable.
