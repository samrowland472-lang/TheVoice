# The Voice Design — loop

## Done
- Iteration: Tightened distribute flush diamond trail timing so sparks and lag stroke share one phase clock (shared phi, trail only ~26° behind lag; spark angles locked to familyLag rotation, radius modulated by trail phase, phosphor-on-ground).
- Prior: Refactored outer counter-breath micro-sparks into a single parameterized trail (6 diminishing sparks + soft radial falloffs, phosphor-on-ground). Removed ~500 lines of copy-pasted near-zero-alpha sparks that no longer rendered.
- Prior: Quieter trailing twenty-third micro-spark on the outer counter-breath diamond with its own soft radial falloff (furthest offset, smallest, shares trail-fade, phosphor-on-ground).
- Prior: Quieter trailing twenty-second micro-spark on the outer counter-breath diamond with its own soft radial falloff (furthest offset, smallest, shares trail-fade, phosphor-on-ground).

## Next recommended
- Canvas depth: deepen layers panel opacity/drag feedback (live opacity scrub while dragging, or drop-hint phosphor edge glow), or add inspector type axis controls for mixed selection.
