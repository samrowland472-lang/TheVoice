# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-21 21:20 BST — Present peek shows frame index on current-dot hover; hairline glow lifts off type.

## Next recommended

Present peek: keyboard left/right still advance while peek is showing; add a tiny next-frame name after the index when Shift is held.

## Done

- Peek current-dot hover/focus reveals a faint `n/total` index beside the strip.
- Peek hairline glow is upward-only so it does not wash the first row of type.
- Restored PresentView after a stub overwrite of present-chrome.tsx.
- Peek dots carry `title={p.name}` so hover names the frame.
- Peek strip wraps and scrolls (`max-w` + `flex-wrap` + `overflow-x-auto`) so long campaigns stay usable.
- Peek dots are buttons with pointer-events; click jumps to that frame without hitting the stage next-click.
- Present idle peek: thin phosphor hairline and current-frame page dots remain after the rail fades (2.8s).
- Peek is suppressed when speaker notes or a chip menu / rename keeps the rail locked open.
- Present-mode idle chrome: campaign rail fades after 2.8s of no pointer/key activity.
- Rail stays fully visible while speaker notes are open or a chip menu / rename is active.
- Restored canvas `drawDocument` / viewport helpers so the artboard paints again.
- Present-mode page dots: current frame gets a phosphor ring + glow; Tab focus-visible ring tightened.
- Restored present chrome (PresentView) so Shift+P is not a blank screen.
- Present-mode speaker notes drawer: N toggles notes; Escape closes the drawer first, then exits present.
