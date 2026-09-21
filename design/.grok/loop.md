# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-21 16:27 BST — Present idle chrome: campaign rail fades after 2.8s.

## Next recommended

Present idle: keep a thin phosphor hairline or page-dot peek so the deck is still discoverable when the rail is hidden.

## Done

- Present-mode idle chrome: campaign rail fades after 2.8s of no pointer/key activity.
- Rail stays fully visible while speaker notes are open or a chip menu / rename is active.
- Restored canvas `drawDocument` / viewport helpers so the artboard paints again.
- Present-mode page dots: current frame gets a phosphor ring + glow; Tab focus-visible ring tightened.
- Restored present chrome (PresentView) so Shift+P is not a blank screen.
- Present-mode speaker notes drawer: N toggles notes; Escape closes the drawer first, then exits present.
