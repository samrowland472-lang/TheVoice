# The Voice Design — loop

## Done
- Iteration: Live phosphor edge + value chips for dash, dash offset, and miter limit ranges in mixed path stroke inspector. Selected outline nodes show a transient phosphor outline and a live label (e.g. “Dash 12”, “Offset -8”, “Miter 6”) while the range is dragged; clears on pointer up. Multi-selection draws every applicable selected outline. Phosphor-on-ground.
- Prior: Live phosphor edge + value chips for remaining inspector ranges — rotation (single + mixed geometry), shadow offset X/Y and spread (ShadowEditor + mixed ink), stroke width (mixed path dash), and gradient angle. Selected nodes show a transient phosphor outline and a live label (e.g. “Rotate 45°”, “X 12”, “Spread 4”, “Width 8”, “Angle 135°”) while the range is dragged; clears on pointer up. Multi-selection draws every applicable selected node. Phosphor-on-ground.
- Prior: Live radius and shadow-blur scrub chips on the canvas. While dragging a radius range (single rect inspector or mixed geometry) or a shadow blur range (mixed ink or ShadowEditor), selected rects/nodes get a transient phosphor edge + value chip (“Radius 12” or “Blur 8”). Clears on pointer up. Multi-selection draws every selected rect (radius) or shadowed node (blur). Single-rect radius range now always visible (even at 0).
- Prior: Live axis scrub chips on the canvas for mixed (and single) type selection. While dragging an inspector type axis range (optical, width, slant, …), selected text nodes get a transient phosphor edge + value chip (e.g. “Width 125”). Clears on pointer up. Multi-selection draws every selected text node that supports the axis.
- Prior: Live opacity scrub feedback on inspector ranges and the layers opacity quick strip (transient phosphor edge + percent chip on the node(s); multi-selection draws every selected node). Clears on pointer up.
- Prior: Live opacity scrub feedback on the canvas while dragging a layers-panel opacity range (transient phosphor edge + percent chip on the node, clears on pointer up).
- Prior: Added phosphor edge glow to layers panel drop hints (before/after bars and into-group ring) so reorder feedback reads as live phosphor-on-ground.
- Prior: Tightened distribute flush diamond trail timing so sparks and lag stroke share one phase clock (shared phi, trail only ~26° behind lag; spark angles locked to familyLag rotation, radius modulated by trail phase, phosphor-on-ground).
- Prior: Refactored outer counter-breath micro-sparks into a single parameterized trail (6 diminishing sparks + soft radial falloffs, phosphor-on-ground). Removed ~500 lines of copy-pasted near-zero-alpha sparks that no longer rendered.

## Next recommended
- Polish mixed type colour / ink chips, or deepen path-point numeric previews, or extend live scrub chips to sides / arrow-head ranges.
