# The Voice Design — loop

## Done
- Iteration: Live axis scrub chips on the canvas for mixed (and single) type selection. While dragging an inspector type axis range (optical, width, slant, …), selected text nodes get a transient phosphor edge + value chip (e.g. “Width 125”). Clears on pointer up. Multi-selection draws every selected text node that supports the axis.
- Prior: Live opacity scrub feedback on inspector ranges and the layers opacity quick strip (transient phosphor edge + percent chip on the node(s); multi-selection draws every selected node). Clears on pointer up.
- Prior: Live opacity scrub feedback on the canvas while dragging a layers-panel opacity range (transient phosphor edge + percent chip on the node, clears on pointer up).
- Prior: Added phosphor edge glow to layers panel drop hints (before/after bars and into-group ring) so reorder feedback reads as live phosphor-on-ground.
- Prior: Tightened distribute flush diamond trail timing so sparks and lag stroke share one phase clock (shared phi, trail only ~26° behind lag; spark angles locked to familyLag rotation, radius modulated by trail phase, phosphor-on-ground).
- Prior: Refactored outer counter-breath micro-sparks into a single parameterized trail (6 diminishing sparks + soft radial falloffs, phosphor-on-ground). Removed ~500 lines of copy-pasted near-zero-alpha sparks that no longer rendered.

## Next recommended
- Unify remaining range scrub feedback (radius, shadow, blur, etc.) with the same phosphor edge + live value chip pattern, or polish mixed type colour / ink chips.
