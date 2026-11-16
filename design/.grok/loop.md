# The Voice Design — loop

## Done
- Iteration: Live radius and shadow-blur scrub chips on the canvas. While dragging a radius range (single rect inspector or mixed geometry) or a shadow blur range (mixed ink or ShadowEditor), selected rects/nodes get a transient phosphor edge + value chip (“Radius 12” or “Blur 8”). Clears on pointer up. Multi-selection draws every selected rect (radius) or shadowed node (blur). Single-rect radius range now always visible (even at 0).
- Prior: Live axis scrub chips on the canvas for mixed (and single) type selection. While dragging an inspector type axis range (optical, width, slant, …), selected text nodes get a transient phosphor edge + value chip (e.g. “Width 125”). Clears on pointer up. Multi-selection draws every selected text node that supports the axis.
- Prior: Live opacity scrub feedback on inspector ranges and the layers opacity quick strip (transient phosphor edge + percent chip on the node(s); multi-selection draws every selected node). Clears on pointer up.
- Prior: Live opacity scrub feedback on the canvas while dragging a layers-panel opacity range (transient phosphor edge + percent chip on the node, clears on pointer up).
- Prior: Added phosphor edge glow to layers panel drop hints (before/after bars and into-group ring) so reorder feedback reads as live phosphor-on-ground.
- Prior: Tightened distribute flush diamond trail timing so sparks and lag stroke share one phase clock (shared phi, trail only ~26° behind lag; spark angles locked to familyLag rotation, radius modulated by trail phase, phosphor-on-ground).
- Prior: Refactored outer counter-breath micro-sparks into a single parameterized trail (6 diminishing sparks + soft radial falloffs, phosphor-on-ground). Removed ~500 lines of copy-pasted near-zero-alpha sparks that no longer rendered.

## Next recommended
- Extend the same phosphor edge + live value chip to remaining ranges (shadow offset/spread, rotation, stroke width, gradient angle, etc.) or polish mixed type colour / ink chips.
