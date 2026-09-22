# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-22 04:10 BST — Peek Shift+hover names that frame; drag-scrub stays quiet.

## Next recommended

Peek: after scrub, a faint tick marks the last frame you dragged through; double-click a peek dot opens notes on that frame without waking the rail.

## Done

- Shift+hover (or focus) on a non-current peek dot names that frame instead of only the next one.
- Click-drag on the peek strip scrubs frames; peek pointer work is quiet so the campaign rail stays hidden.
- Home / End jump first / last frame and stay on the quiet-nav list so peek does not wake the rail.
- Long next-frame names truncate with a right-edge fade so they do not shove peek dots.
- Peek left/right (and Space / Page keys) advance frames without waking the campaign rail.
- Shift held while peek is showing appends the next-frame name after `n/total`.
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
