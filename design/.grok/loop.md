## Iteration

2026-10-17 03:01 BST — Generalized the caption-width step chain in align-preview seating. Instead of unrolled hundred-plus special-case steps, the drop path now loops the core one-caption-width tuck until the move-count clears the lead or the seat stops moving at the crop edge. Prefer the seat just beside the lead closest to the count; if that seat still covers the lead, use the other side of the lead, then the crop ends. Stamp alpha unchanged. Esc still clears it early.

## Done

- Replaced the hundred-plus chained caption-width step wrappers with a bounded loop that keeps stepping one caption-width off the edge into the next gap beside the lead until the count clears the lead or the position stabilizes.
- Kept the early vertical caption-height drops, slide, and one-caption tuck. Fallback to the best vertical seat remains.
- Removed the redundant stepCountSecond…stepCountHundredFifth wrappers so the seating logic stays maintainable for any lead width.

## Backlog

- Prefer the seat just beside the lead closest to the count when the loop lands on a shared span; if that seat still covers the lead, try the other side before crop ends. Esc still clears it early.

## Next recommended

Prefer the seat just beside the lead closest to the count when the loop lands on a shared span; if that seat still covers the lead, try the other side before crop ends. Esc still clears it early.
