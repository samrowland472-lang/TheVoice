# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-21 17:35 BST — Present idle peek: phosphor hairline + page-dot strip stay when the campaign rail fades.

## Next recommended

Present peek: clicking a peek dot should jump frames even while the rail is hidden.

## Done

- Present idle peek: thin phosphor hairline and current-frame page dots remain after the rail fades (2.8s).
- Peek is suppressed when speaker notes or a chip menu / rename keeps the rail locked open.
- Present-mode idle chrome: campaign rail fades after 2.8s of no pointer/key activity.
- Rail stays fully visible while speaker notes are open or a chip menu / rename is active.
- Restored canvas `drawDocument` / viewport helpers so the artboard paints again.
- Present-mode page dots: current frame gets a phosphor ring + glow; Tab focus-visible ring tightened.
- Restored present chrome (PresentView) so Shift+P is not a blank screen.
- Present-mode speaker notes drawer: N toggles notes; Escape closes the drawer first, then exits present.
