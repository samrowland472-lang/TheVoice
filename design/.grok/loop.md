## Iteration

2026-10-17 04:01 BST — When the caption-width step loop lands on a shared span with the lead, the seat now prefers the just-beside position closest to the count. If that seat still covers the lead, it tries the opposite side of the lead before falling to the crop ends. Stamp alpha unchanged. Esc still clears it early.

## Done

- stepCountOneMoreCaptionWidthOffEdgeBesideLead now computes the preferred (inward) side first, choosing the closest clear beside-lead seat to the current count.
- If the preferred side still covers the lead, it tries the opposite horizontal side with the same closest-seat preference before accepting a covering or end seat.
- The drop path loop continues to bound steps until clear or stable; early vertical drops, slide, and one-caption tuck remain.

## Backlog

- Keep the move-count seating off stay stamps and crop edges for multi-line releases when both sides are blocked by wide leads.

## Next recommended

Keep the move-count seating off stay stamps and crop edges for multi-line releases when both sides are blocked by wide leads.
