## Iteration

2026-10-21 05:05 BST — Inspector geometry fields now show compact labels (X Y W H R Rad) and mixed-state markers. Multi-select with differing values displays “· mixed” and an em-dash placeholder; committing a number writes it onto every selected layer. Name field does the same when names differ. Phosphor chrome unchanged.

## Done

- GeoField labels and mixed flags for X/Y/W/H/rotation/radius in inspector.tsx.
- Mixed name placeholder and aria-label.
- Typecheck, build, and browser-smoke verified.

## Backlog

- Optional deeper inspector or layers polish.
- Export/present vertical slices.

## Next recommended

Focused export/present slice (crop or campaign readout) or denser mixed ink/type chips.
