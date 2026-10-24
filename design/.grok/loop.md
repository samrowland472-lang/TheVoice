# The Voice Design — Improvement Loop

## Done
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
- Text layers in the Layers panel now show a compact tracking badge next to the type-size badge (click to open an inline number field for exact tracking entry, Enter/Escape, range -8 to 40).
- Text layers in the Layers panel now show a compact leading badge next to the size and tracking badges (click to open an inline number field for exact leading entry, Enter/Escape, range 0.7–2, step 0.02). Type quick strip now includes a Leading scrubber and shows size / tracking / leading in the summary.
- Live phosphor type rhythm overlay: while scrubbing Size, Tracking, or Leading (in the inspector, mixed type, or Layers Type quick strip) horizontal leading lines and approximate tracking ticks appear on selected text layers.
- Text layers in the Layers panel now show a compact weight badge next to the size / tracking / leading badges (click to open an inline number field for exact weight entry, Enter/Escape, range 100–900, step 100).

- Text layers in the Layers panel now show a compact font-family badge (first word of the family name) next to the weight badge. Click opens a picker of the canvas fonts; change or Escape/blur closes it.
- Type rhythm overlay (phosphor leading lines + tracking ticks) now reacts to keyboard nudges on Size / Tracking / Leading ranges: Arrow keys, Home, End, PageUp/PageDown show the live ghost while the key is held and clear + commit on keyup or blur (Layers Type quick strip, inspector Type fields, and mixed Type).

## Iteration
2026-10-24 18:10 BST — Type rhythm overlay now follows keyboard nudges on Size, Tracking, and Leading ranges (Arrow / Home / End / Page). Ghost clears and commits on keyup or blur. Verified typecheck, build, and browser smoke.

## Next recommended
- Weight badge in the Type quick strip.
- Compact font-family badge also appears in the Type quick strip.
- Weight range in Layers Type quick strip with live preview.
