# The Voice Design — loop

## Done
- Iteration: Live opacity scrub feedback on inspector ranges and the layers opacity quick strip (transient phosphor edge + percent chip on the node(s); multi-selection draws every selected node). Clears on pointer up.
- Prior: Live opacity scrub feedback on the canvas while dragging a layers-panel opacity range (transient phosphor edge + percent chip on the node, clears on pointer up).
- Prior: Added phosphor edge glow to layers panel drop hints (before/after bars and into-group ring) so reorder feedback reads as live phosphor-on-ground.
- Prior: Tightened distribute flush diamond trail timing so sparks and lag stroke share one phase clock (shared phi, trail only ~26° behind lag; spark angles locked to familyLag rotation, radius modulated by trail phase, phosphor-on-ground).
- Prior: Refactored outer counter-breath micro-sparks into a single parameterized trail (6 diminishing sparks + soft radial falloffs, phosphor-on-ground). Removed ~500 lines of copy-pasted near-zero-alpha sparks that no longer rendered.

## Next recommended
- Inspector type axis controls polish for mixed selection (live preview chips while scrubbing axes), or unify remaining range scrub feedback (radius, shadow, etc.).
