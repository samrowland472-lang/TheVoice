## Done
- 2026-11-27T22:05Z — On-canvas stop reorder drag affordance polish for mixed selections: when dragging a gradient stop on a multi-node selection, short denser phosphor ticks radiate from the active stop circle (linear and radial) so the reorder gesture reads precise and secondary. Status line shows “Reorder stop” when the index changes. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-27T21:08Z — Mixed-selection stop chip density polish: gradient stop circles and percent chips render denser (smaller radius, tighter glow, reduced opacity) whenever the selection contains more than one node, so multi-node uniform gradient selections stay secondary and uncluttered. Focused or hovered stops remain full size. Applies to both linear and radial. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-27T20:10Z — Denser r0 handle ticks when inner radius focused: short phosphor ticks radiate from the circle perimeter of the radial inner-radius handle while it is hovered or dragged, so the active r0 point reads denser and more precise. Ticks scale with zoom and stay clear of the handle. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-27T10:08Z — Denser radial centre cross ticks when centre focused: short phosphor ticks radiate from each arm end of the outer centre cross handle while the radial centre is hovered or dragged, so the active centre point reads denser and more precise. Ticks scale with zoom and stay clear of the cross. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-27T09:05Z — Denser radial focal diamond ticks when focal focused: short phosphor ticks radiate from each vertex of the inner focal diamond handle while the radial focal is hovered or dragged, so the active focal point reads denser and more precise. Ticks scale with zoom and stay clear of the diamond. Typecheck, build, smoke clean (hub content visible, canvas present).

## Next recommended
- On-canvas stop color picker affordance polish for mixed selections

## Backlog
24. Reorder gradient stops by dragging past each other (done this pass)
23. Inspector fields for linear length and offset (done)
22. On-canvas linear gradient angle handle for mixed selections (done)
21. Gradient stop editing in mixed selection (done)
20. Context-aware / denser gradient dimension chips (done)
19. Mixed-selection stop chip density polish (done this pass)
