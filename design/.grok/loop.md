# The Voice Design — Improvement Loop

## Done
- Path inspector: multi-select reverse relative order of selected points within a consecutive run only (Run). With two or more points selected (Shift-click), a Run button appears next to Ord. Clicking reverses the relative order only inside each consecutive run of selected points (non-adjacent selected points stay in separate runs and are not mixed). Unselected siblings stay put. In/out handles swap so local curves reverse. Mirror flags follow the points. Selection indices remain valid. Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Layers: multi-select reverse stacking order (Rev). With two or more layers selected, a Rev button appears next to Duplicate. Clicking reverses the relative stacking order of the selected layers within each shared parent (unselected siblings stay in place; later-in-array becomes earlier). Preference is not stored; order is committed immediately. Tooltip explains the action. Verified typecheck, build, and browser smoke.

- Type inspector: reverse type baseline / leading direction toggle (Rev). A Rev button in the Rhythm strip toggles reverse leading. When on, canvas rhythm baselines and ticks stack from the bottom of the text box (first line at the bottom); strip baseline and density ticks flip vertical emphasis to match. Preference persists in localStorage. Tooltip explains the action. Verified typecheck, build, and browser smoke.

- Path inspector: multi-select reverse relative order of selected points (Ord). With two or more points selected (Shift-click), an Ord button appears next to Del. Clicking reverses the relative order of the selected points among their slots (unselected points stay put), swaps each point’s in/out handles so local curves reverse, and moves Mirror flags with the points. Selection indices remain valid. Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Path inspector: Rev button reverses path direction. Clicking Rev flips the order of points on the outer path and any holes, and swaps each point’s in/out handles so the curves remain continuous. Point selection is cleared. Tooltip explains the action. Verified typecheck, build, and browser smoke.

- Path inspector: multi-select delete points (Del). With two or more points selected (Shift-click), a Del button appears next to Zro. Clicking removes all selected points. Holes left with fewer than 3 points are dropped; the whole path is removed if fewer than 2 points remain. Selection clears after. Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Path inspector: multi-select handle axis bulk set (Hz / Vt). With two or more points selected (Shift-click), Hz and Vt buttons appear next to Sm/Cr. Clicking sets all selected points’ handles to horizontal or vertical (length preserved, zero handles left alone, Mirror honored). Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Path inspector: multi-select zero handles (Zro). With two or more points selected (Shift-click), a Zro button appears next to Vt. Clicking sets all handles on the selected points to length 0 (removes arms). Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Path inspector: multi-select Smooth/Corner bulk toggle. With two or more points selected (Shift-click), a Sm/Cr/Mix button next to Mir shows the state. Clicking sets all selected points to Smooth (auto handles) or Corner. Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Path inspector: multi-select Mirror bulk toggle. With two or more points selected (Shift-click), a Mir button next to the Sel average shows on/off/mixed state. Clicking sets Mirror for all selected points (and mirrors the opposite handle when turning on). Persists via the existing per-point localStorage memory. Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

- Type rhythm overlay: density factor double-click reset to 1. Double-clicking the Den factor slider or the density preview thumbnail resets the scale factor to 1.0 (and clears a density-only ghost). Tooltips on the Den button, slider, and thumbnail mention the reset. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: density factor live canvas preview while scrubbing the factor slider. Scrubbing the Den factor (or Arrow-nudging it) temporarily shows the phosphor density ghosts on the selected type; the ticks update live with the factor. Clears on pointer-up or blur if the ghost was only for the preview. Canvas redraws on factor changes. Tooltip updated. Verified typecheck, build, and browser smoke.
- Path inspector: multi-select points keyboard bulk length nudge. With two or more points selected (Shift-click), Arrow keys nudge the bulk handle length by 1 px (Shift for 10) when not typing in a field. Direction is preserved, zero handles seed horizontal, Mirror is honored. Sel tooltip mentions the shortcut. Verified typecheck, build, and browser smoke (content visible; pre-existing hydration note on mobile).
- Type rhythm overlay: density factor live canvas ghost preview on thumbnail hover. Hovering the density thumbnail temporarily shows the phosphor rhythm density ghosts on the selected type on the canvas (using the current factor). Clears on leave if it was the only ghost. Tooltip updated. Verified typecheck, build, and browser smoke.
- Path inspector: per-ring handle length averages and bulk set. Outer and each hole show their own average length plus a compact NumField that sets only that ring's handles (direction preserved, zero seeds horizontal, Mirror honored). Global All bulk remains. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: density factor visual density preview thumbnail. When Den is on, a compact phosphor SVG thumbnail beside the factor slider and NumField shows a live sample of density ticks (spacing scales with 1/factor). Tooltip mentions the preview. Verified typecheck, build, and browser smoke.
- Path inspector: bulk handle length. Avg shows the mean length of every existing in/out handle (outer path + holes). A compact NumField beside it sets all handle lengths to an exact value: direction is preserved, zero handles seed a horizontal arm, and per-point Mirror is honored. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: density factor click-to-edit exact number. When Den is on, a compact NumField sits beside the factor slider. Click it, type a value (0.4–2.5), Enter/blur commits and clamps. Slider and keyboard nudge unchanged. Tooltip mentions exact entry. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: density factor keyboard nudge. While the factor slider is focused, Arrow keys adjust the density scale (0.05 step, Shift for 0.25). Home/End/PageUp/PageDown also work. Tooltip and Den button mention the shortcut. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: density scale factor slider (0.4–2.5, persisted). When Den is on, a compact range next to the toggle multiplies the size-based densification on both the canvas ghosts and the Type inspector Rhythm strip. Higher factor = denser ticks. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: optional glyph density scale (Den toggle, persisted). Intermediate density and average-advance tick spacing scale with the ghosted font size (denser for larger type) on both the canvas and the Type inspector Rhythm strip. Wt and Glyph toggles unchanged. Verified typecheck, build, and browser smoke.
- Type rhythm overlay: optional weight-specific tick thickness (Wt toggle, persisted). While scrubbing weight, canvas and inspector Rhythm strip ticks scale thickness and height with the ghosted font weight (relative to 400). Direction and spacing unchanged. Verified typecheck, build, and browser smoke.
- Path point inspector: canvas tangent length numbers are now click-to-edit (floating phosphor input). Clicking a live length on the canvas opens an exact number field; committing scales the handle while preserving direction (or seeds a horizontal arm). Mirror is honored. Len tooltip mentions canvas click-to-edit. Verified typecheck, build, and browser smoke.
- Path point inspector: length readouts next to In/Out handles are now click-to-edit exact numbers (NumField). Setting a length scales the handle while preserving direction (or seeds a horizontal arm from zero). Mirror is honored. Len tooltip mentions the click-to-edit. Verified typecheck, build, and browser smoke.
- Path point inspector: while Len is on and a handle (In or Out) is selected, Arrow keys nudge its length by 1 px (Shift for 10). Direction is preserved, mirror is honored, and numbers update live on the canvas and in the row. Len tooltip mentions the shortcut. Verified typecheck, build, and browser smoke.
- Layers Type quick strip: Alt+T cycles focus (size → weight → tracking → leading) while the Layers panel is focused. Opens the next number editor pre-filled, commits the previous field, and flashes on remembered values. Tooltip mentions the shortcut.
- Path point inspector Len toggle now also shows live rounded tangent length numbers in the point row next to the In and Out handle fields (phosphor tabular mono). Lengths match the canvas numbers and update as handles change. Len button tooltip mentions both canvas and row.
- Path point inspector now has a Len toggle (persisted in localStorage) that shows live phosphor tangent length numbers on the canvas next to the active in/out handle while it is focused or dragged. Numbers follow the measured handle length and update as the arm changes.
- Type quick strip collapses and expands with Shift+T when the Layers panel is focused (no modifier conflicts). The chevron button title mentions the shortcut. Collapse state still persists in localStorage.
- Type quick strip is now collapsible (phosphor chevron, state remembered in localStorage). When collapsed, the size / weight / tracking / leading / family mini badges stay available on hover or focus of the strip. Layer-row type badges are hover-only (always visible when the layer is selected), independent of strip state.
- Type quick strip Mixed badges now open their editor starting from the last value applied to that property (size, weight, tracking, leading, family). Falls back to the last selected node when no prior value has been set this session. Mixed labels remain only on the specific properties that differ.
- Clipboard and selection actions now work: Duplicate (Cmd+D), Copy (Cmd+C), Cut (Cmd+X), Paste (Cmd+V), Remove (Delete), Select all (Cmd+A).
- Groups and their children are cloned together with remapped parent IDs.
- Layers panel has a Duplicate button next to Group / Ungroup.
- Command palette lists Duplicate, Copy, Cut, and Paste.
- Fit artboard and zoom shortcuts set view intent correctly.
- Layers panel rows now include a compact opacity scrubber for direct per-layer opacity tweaks without leaving the list.
- Opacity scrubber in Layers rows is now hover-only (or always visible when the layer is selected) with a larger hit target for better usability.
- Layers opacity control now includes a clickable percent badge that opens an inline number field for exact percent entry (Enter/Escape), alongside the scrubber.
- Path point inspector now shows Bézier in/out handle offsets (when present) plus Smooth / Corner / Delete actions on every point row.
- Live phosphor dash/offset ghost overlay on the canvas while scrubbing Stroke Dash or Offset in the inspector.
- Live phosphor overlay while scrubbing Stroke Width, and hover/focus/change preview for Cap and Join selects (consistent with dash ghost).
- Live phosphor overlay while scrubbing Stroke Miter Limit, Polygon/Star Sides, and Arrow Head Scale (same ghost system).
- Alt+ArrowUp/Down steps selection opacity by 1% while the Layers panel is focused (clamped 0–100%). Tooltips mention the shortcut.
- Path point inspector now has a Mirror toggle that keeps in/out handles mirrored. Focusing a handle field highlights that arm with a live tangent guide overlay on the canvas.
- Layers panel now shows a Type quick strip (Size + Tracking) whenever text layers are selected. Scrubbers and number fields update live; mixed selections show Mixed and apply to all selected text.
- Text layers in the Layers panel now show a compact type-size badge (click to open an inline number field for exact size entry, Enter/Escape).
- Text layers in the Layers panel now show a compact tracking badge (click to open an inline number field for exact tracking entry, Enter/Escape).
- Text layers in the Layers panel now show a compact leading badge (click to open an inline number field for exact leading entry, Enter/Escape).
- Layers Type quick strip summary now shows size / tracking / leading and is clickable for exact entry (inline number fields, Enter/Escape/blur). Mixed any property shows Mixed.
- Live phosphor type rhythm overlay on the canvas while scrubbing Size, Tracking, or Leading in the Layers Type quick strip (or the Type inspector). Leading lines and tracking ticks update live with the ghost values.
- Type rhythm overlay (leading lines + tracking ticks) now reacts to keyboard nudges on Size / Tracking / Leading ranges: Arrow keys, Home, End, PageUp/PageDown show the live ghost while the key is held and clear + commit on keyup or blur (Layers Type quick strip, inspector Type fields, and mixed Type).
- Layers Type quick strip now includes a Weight range (100–900, step 100) with live canvas updates and a NumField for exact entry. Mixed weights show Mixed and apply to all selected text.
- Type quick strip summary now includes weight (size / weight / tracking / leading). Mixed any property shows Mixed.
- Layers Type quick strip now includes a Family select of canvas fonts. Mixed families show Mixed and a choice applies to the selection.
- Type quick strip summary now has compact click-to-edit weight and font-family badges (inline number field / picker, Enter/Escape/blur). Mixed shows Mixed.
- Live phosphor type rhythm overlay now includes weight: scrubbing the Weight range (or keyboard) sets a weight ghost that updates measured advance and thickens leading lines on selected text.
- Type rhythm overlay now draws tracking ticks while scrubbing Weight (independent of Tracking). Advance is measured with the ghost weight so density updates live; leading lines still thicken.
- Type inspector and Mixed Type weight ranges now match Layers: 100–900 (step 100). Scrub, keyboard-nudge, or exact entry now cover the full phosphor weight scale consistently across panels.
- Type quick strip summary now shows per-property badges even when mixed: Mixed properties display a phosphor “Mixed” label (click still opens the editor to set the value on all selected text). Non-mixed show the live value. Family badge included.
- Type rhythm overlay now draws baseline ticks (left and right vertical markers) on each leading line while scrubbing Size or Leading. The ticks track the ghosted size and leading live so the baseline rhythm stays visible during type adjustments.
- Type rhythm overlay for Size ghosts now also draws a mid-line center tick on each baseline plus intermediate density marks spaced by the ghosted size. The marks update live while the Size range is scrubbed.
- Type rhythm overlay for Leading ghosts now draws a mid-line center tick plus intermediate density marks along each baseline. Density spacing follows the ghosted line height so the vertical rhythm stays readable while scrubbing.

- Type quick strip Mixed editors now remember last-used values (size, weight, tracking, leading, family) across page reloads via localStorage. Editors still start from the remembered value when a property is mixed; Mixed badges remain per-property.

- Type inspector now includes a compact phosphor Rhythm strip that draws baseline ticks, a mid-line center mark, density ticks, and tracking marks matching the canvas type rhythm overlay. Updates live while scrubbing size, leading, tracking, or weight (and when a type ghost is active).

- Type rhythm overlay tracking density marks now follow the measured average advance of each line’s content (instead of a single approximate top row). Weight and tracking ghosts draw the marks near every baseline so density tracks the live type more closely. The Type inspector Rhythm strip uses the same measured advance for its tracking marks.

- Layers Type quick strip now flashes a subtle phosphor pulse when a Mixed badge opens an editor pre-filled from the remembered last-used value (size, weight, tracking, leading, or family). The flash confirms memory was applied.

- Layers Type quick strip Mixed badges now flash individually (phosphor pulse on the specific badge) when opened with a last-used value from localStorage. The pulse confirms which property received the remembered value.

- Type rhythm overlay now draws per-glyph advance ticks for short lines (≤8 glyphs) while scrubbing tracking or weight. Ticks sit at each character’s center, aligned to the line’s text-align, so tracking rhythm is precise on headlines and short copy. Longer lines keep the average-advance marks.

- Type inspector Rhythm strip matches the canvas: when the measured sample is short (≤8 characters) it draws per-glyph ticks instead of average spacing.

- Type rhythm overlay now has a Glyph toggle (persisted in localStorage) that shows per-glyph advance ticks independently of line length. When on, ticks are drawn for lines up to 32 glyphs (average spacing beyond that); when off, average spacing is used for all lines. The Type inspector Rhythm strip includes the same toggle and matches the canvas.

- Path point inspector Len toggle now also shows both in and out tangent lengths at once on the canvas when the anchor is selected (in addition to the focused/dragged handle). Lengths update live with the measured handle arms.

- Path point inspector Mirror state is now remembered per point (node + index + hole) across reloads via localStorage. Toggling Mirror on a point keeps it on when you return to that point, and the opposite handle stays mirrored while you edit either arm.

- Layers Type quick strip Alt+T cycle now includes family (size → weight → tracking → leading → family). Shift+Alt+T cycles in reverse. Family opens its select; other fields still commit on cycle. Tooltip mentions both directions.

- Type inspector: baseline alignment toggle (Hng / Alp / Mid). In the Rhythm strip, three buttons set the canvas textBaseline (hanging / alphabetic / middle). Preference persists in localStorage. Rhythm ghosts and the strip ticks follow the chosen baseline. SVG export uses the matching dominant-baseline. Tooltip explains each mode. Verified typecheck, build, and browser smoke (content visible; pre-existing hydration note on mobile).

- Path inspector: multi-select reverse relative order of selected points within a consecutive run only (Run). With two or more points selected (Shift-click), a Run button appears next to Ord. Clicking reverses the relative order only inside each consecutive run of selected points (non-adjacent selected points stay in separate runs and are not mixed). Unselected siblings stay put. In/out handles swap so local curves reverse. Mirror flags follow the points. Selection indices remain valid. Tooltip on Sel mentions it. Verified typecheck, build, and browser smoke.

## Iteration
2026-10-30 22:05 GMT — Path inspector: multi-select reverse relative order of selected points within a consecutive run only (Run). Verified typecheck, build, and browser smoke.
## Next recommended
- Path inspector: keyboard nudge for multi-select reverse order.
- Path inspector: multi-select reverse relative order of selected points within a consecutive run only (done).
- Type inspector: baseline alignment toggle (done).
- Layers: multi-select reverse stacking order (done).
