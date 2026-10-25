# The Voice Design — Improvement Loop

## Done
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

## Iteration
2026-10-25 07:05 GMT — Added TypeRhythmPreview strip to the Type inspector (and Mixed Type) so the baseline ticks and density marks match the canvas rhythm overlay while scrubbing. Verified typecheck, build, and browser smoke.
## Next recommended
- Type rhythm overlay: density marks for tracking ghosts that follow measured advance more closely.
- Show a subtle phosphor flash on the Layers Type strip when a last-used value is applied from memory.
