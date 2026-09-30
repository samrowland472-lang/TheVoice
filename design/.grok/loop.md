# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-30 11:20 BST — Selection export: PNG and SVG of the current selection on the same artboard. `selectionDocument` filters nodes by id. Typecheck helpers restored for present peek + PDF page counts.

## Next recommended

Select one headline on a board, Export → Selection PNG, and confirm the file keeps the artboard size with only that layer.

## Done

- selectionDocument(doc, ids)
- Export menu: Selection PNG / Selection SVG (disabled with empty selection)
- pdfTypePageCount / pdfPagesCountField + countPdfTypePageObjects
- present-idle peek caption/tick helpers exported for typecheck
- placeNodes places typed
- esc() SVG entities

## Backlog

- Tight crop selection export (bbox instead of full artboard)
- Isolate + export current isolate set
- Layer groups
