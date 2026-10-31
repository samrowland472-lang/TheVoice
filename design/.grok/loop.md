## Iteration 2026-10-31T12:06:00Z

**Done:** Brush tip preview now shows a scatter direction indicator when the selected brush has scatter and the pen is tilted. A phosphor cross (longer along the tilt axis, shorter across) appears over the tip, scaled to the live size, scatter strength, and tilt magnitude — matching the directional offset used by the dab engine. Upright or zero-scatter brushes stay clean.

**Next recommended:** Live dab-interval readout (px) next to the tip that tracks pressure-scaled spacing during a stroke, or a small grain/noise toggle preview in the tip.

## Iteration 2026-10-31T11:11:35Z

**Done:** Brush tip preview in the inspector now scales with live stroke pressure and flattens into a tilt-matched ellipse (same size/opacity curve and aspect as the dab engine). The Stroke readout under Hard / Space stays in sync for the whole stroke, not only on inspector re-renders. Also fixed the canvas stage so it fills its parent — pointer hits reach the paint surface again instead of falling through a zero-height pasteboard.

**Next recommended:** Scatter direction indicator in the tip preview, or a small spacing readout next to the tip that tracks the live dab interval.

## Iteration 2026-10-31T10:10:38Z

**Done:** Scatter is now directional with pen tilt. When the stylus is tilted, random dab offsets stretch along the tilt axis and compress across it (strength scales with tilt magnitude). Upright pen and mouse keep isotropic scatter. Works with existing scatter presets (pencil, charcoal, spray, watercolor).

**Next recommended:** Live pressure-scaled tip preview in the inspector, or a small scatter direction indicator in the tip preview.

## Iteration 2026-10-31T10:07:49Z

**Done:** Brush inspector now shows a persistent Stroke readout for live pressure % and tilt ° while a paint stroke is active (phosphor when painting, dashes when idle). It sits under the Hard / Space sliders and updates with the stroke session.

**Next recommended:** Directional scatter based on tilt angle, or a live pressure-scaled tip preview in the inspector.

## Iteration 2026-10-31T09:09:59Z

**Done:** Tilt now flattens paint dabs into ellipses (aspect and rotation follow pointer tilt). Live brush cursor matches the tilted shape and pressure-scaled size. Bottom hint shows live pressure % and tilt ° while painting. Mouse still paints full circular strength.

**Next recommended:** Directional scatter based on tilt angle, or a persistent pressure/tilt readout in the Brush inspector while a stroke is active.

## Iteration 2026-10-31T08:12:00Z

**Done:** Stroke engine now accepts pointer pressure and tilt. Size and opacity scale with pressure (mouse / non-pen still paints at full strength). Tilt is stored on the session as a stub for future ellipse / directional scatter. Inspector Brush tip preview shows a compact Sp % readout under the tip.

**Next recommended:** Apply tilt to dab ellipse or directional scatter, or a live pressure indicator while painting with a pen.

## Iteration 2026-10-31T07:10:01Z

**Done:** Paint layer inspector Brush section now includes a live circular tip preview. It shows the current size (scaled), hardness (solid core vs soft radial falloff), color, and opacity, with a dashed hard-core ring so the live hardness is obvious at a glance. Updates immediately with the Hard slider and dock values.

**Next recommended:** Pressure and tilt stubs in the stroke engine, or a small spacing readout next to the tip preview.

## Iteration 2026-10-31T06:08:14Z

**Done:** When a Paint layer is selected, the inspector now shows a compact Brush section with Hard and Space sliders. Values stay in sync with the dock and live stroke engine so hardness and dab spacing can be tuned without leaving the layer context.

**Next recommended:** Pressure and tilt stubs in the stroke engine, or a small live brush tip preview in the inspector Brush section.

## Iteration 2026-10-31T05:08:16Z

**Done:** Brush and eraser now show a live cursor that matches the current size and hardness. The outer ring is the full brush diameter, the dashed inner ring marks the hard core, and a crosshair sits at the tip. System cursor is hidden while the tool is active so the size preview stays accurate. Hint text includes hardness.

**Next recommended:** Compact Hard / Space controls in the inspector when a Paint layer is selected, or pressure/tilt stubs for the stroke engine.

## Iteration 2026-10-31T04:25:00Z

**Done:** Brush dock now exposes Hard and Space sliders (hardness + dab spacing). Live values override the preset defaults in both the stroke preview swatch and on-canvas paint stamps, so soft airbrush / dense pixel / sparse spray all respond immediately without changing the preset name.

**Next recommended:** Brush cursor that matches live size while painting, or hardness/spacing in a compact inspector section when a Paint layer is selected.
