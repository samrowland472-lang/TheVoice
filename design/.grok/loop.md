# The Voice Design — Improvement Loop

## Done
- Guide look presets in command palette. Phosphor dash / Ice solid / Amber tight / Magenta dash apply color+dash to selected (or all) guides. Shared constants. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 1: Added persistent recent colors swatches in the fill inspector. Colors used in solid fills or gradient stops are remembered (up to 8, localStorage) and shown as clickable chips under the color picker. Multi-select ink also records them.
- Iteration 2: Polished recent colours — live-updating chips (event-driven), clear button, hover ring, and recent swatches now appear for multi-select fill/stroke and type colour. Stroke, shadow, and brush colours are also remembered.
- Iteration 3: Layer search focus + keyboard jump. Cmd/Ctrl+F focuses the layers filter. While filtering, ↑/↓ cycle matching layers (select + scroll into view), Enter commits the current match, Esc clears.
- Iteration 4: Copy / paste style. Copies fill, stroke, stroke width, opacity, and blend from the first selected layer and pastes onto the current selection. Available as commands and via Cmd/Ctrl+Alt+C / V.
- Iteration 5: Style paste now also includes shadow (color, blur, offset, spread, inset). Mixed detection accounts for shadow differences.
- Iteration 6: Artboard guides lock/unlock bulk action. Selected guides can be locked or unlocked together. Per-guide lock and hide toggles. Locked guides refuse move/nudge/delete. Hidden guides are skipped on canvas. Keyboard delete and arrows act on guide selection.
- Iteration 6b: Polished guides lock — Lock/Unlock now apply to all guides when none are selected; history commit + status strip feedback; patchGuide commits for undo.

- Iteration 7: Guide labels editable in the inspector list. Optional short name (max 32) on each guide, committed for undo, status feedback. Labels draw near the guide on the canvas when set.
- Iteration 8: Per-guide color override. Color swatch in the guides list cycles the palette (or clears). Canvas and labels draw with the override via resolveGuideStroke. Status + undo commit.
- Iteration 9: Per-guide dash override. Dash chip in the guides list cycles solid/dash/tight (or clears on repeat). Drawing uses the override via resolveGuideStroke. Status + undo commit. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 10: Bulk dash apply for guides. Dash / Tight / Solid / None buttons in the guides toolbar set the dash override on the selection (or all guides when none are selected). History commit + status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.


- Iteration 11: Bulk color apply for guides. Color swatches + Clear in the guides toolbar set the color override on the selection (or all guides when none are selected). History commit + status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 12: Style paste now also includes stroke dash, dash offset, line cap, line join, and miter limit. Copy from first selected layer; paste applies them with history commit. Mixed detection covers the new stroke fields. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 13: Guide color + dash combined bulk presets. Cyan dash / Ice tight / Phos solid / Mag dash buttons plus Reset look in the guides toolbar apply both overrides in one history commit (selection or all). Status strip feedback. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
## Iteration
- 2026-11-20T01:05:57Z — Guide look presets in command palette. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T02:15:00Z — Recent colors slice. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T03:05:45Z — Recent colours polish. Reactive chips + clear + broader coverage (stroke/shadow/brush/type). Auth OFF, DB OFF, localStorage only.
- 2026-11-19T04:06:00Z — Layer search focus + keyboard jump to matching layers. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T05:15:00Z — Copy/paste style (fill + stroke + opacity + blend). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T15:05:00Z — Style copy/paste now carries shadow. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T17:20:17Z — Artboard guides lock/unlock bulk action. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T17:32:00Z — Guides lock polish (all-when-empty, commit, status). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

- 2026-11-19T18:12:25Z — Guide labels editable + canvas draw. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

- 2026-11-19T19:10:00Z — Per-guide color override in the guides list. Color swatch cycles palette; drawing uses resolveGuideStroke. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

- 2026-11-19T20:15:00Z — Per-guide dash override in the guides list. Dash button cycles GUIDE_DASHES; canvas uses dashArray. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

- 2026-11-19T21:08:00Z — Bulk dash apply to selected (or all) guides. Dash/Tight/Solid/None buttons. Commit + status. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.


- 2026-11-19T22:04:27Z — Bulk color apply to selected (or all) guides. Color chips + Clear. Commit + status. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T23:25:00Z — Style paste includes stroke dash / line cap / join / miter. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-20T00:11:06Z — Guide color + dash combined bulk presets. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
## Next recommended
- Recent colours also in the single-node stroke inspector if one exists.
- Or: layer filter also matches group contents / path points.
- Or: stroke dash scrub preview on canvas while dragging the dash field.
- Or: per-guide look presets from the command palette (already done for bulk).
