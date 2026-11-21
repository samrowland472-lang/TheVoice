# The Voice Design — Improvement Loop

## Done
- Iteration 38: Layer filter highlight. Matching text in layer names, text content, and path-point coordinates is marked with a phosphor highlight in the list. Non-name matches show a short snippet. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 37: Single-node dash named presets active state (Solid / Dash / Dot / Long / Gap). Chips highlight with phosphor when current dash + offset match, phosphor ghost on hover/focus, history commit, and status strip. Matches multi-select. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 36: Single-node dash pattern numeric chips (0 / 4 / 8 / 16). Chips with active highlight when matched, phosphor ghost on hover/focus, history commit, and status strip. Matches multi-select. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 35: Single-node dash offset numeric chips (0 / 2 / 4 / 8 / -4). Chips with active highlight when matched, phosphor ghost on hover/focus, history commit, and status strip. Matches multi-select. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 34: Single-node miter-limit presets (Soft 2 / Default 4 / Sharp 10 / Hard 20). Chips with active highlight when matched, phosphor ghost on hover/focus, force join=miter, history commit, and status strip. Matches multi-select. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 33: Single-node line-cap / join preset chips. Butt/Round/Square and Miter/Round/Bevel chips with icons, active highlight when matched, phosphor ghost on hover/focus, history commit, and status strip. Matches multi-select. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 32: Single-node named stroke width presets (Hair 1 / Fine 2 / Medium 4 / Bold 8). Chips with active highlight when matched, phosphor ghost on hover/focus, history commit, and status strip. Matches multi-select. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 31: Single-node stroke width numeric quick chips (0.5 / 1.5 / 3 / 6). Active highlight when matched, phosphor ghost on hover/focus, history commit, and status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 30: Multi-select dash pattern numeric chips (0 / 4 / 8 / 16). Active highlight when matched (non-mixed), phosphor ghost on hover/focus, history commit, and status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 29: Multi-select dash offset numeric chips (0 / 2 / 4 / 8 / -4). Active highlight when matched (non-mixed), phosphor ghost on hover/focus, history commit, and status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 28: Multi-select stroke width numeric quick chips (0.5 / 1.5 / 3 / 6) alongside named Hair/Fine/Medium/Bold presets. Active highlight when matched (non-mixed), phosphor ghost on hover/focus, history commit, and status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 27: Multi-select stroke width presets (Hair 1 / Fine 2 / Medium 4 / Bold 8). Chips with active highlight when matched (non-mixed), phosphor ghost on hover/focus, history commit, and status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 26: Multi-select line-cap and line-join preset chips. Butt/Round/Square and Miter/Round/Bevel chips with icons, active highlight when matched (non-mixed), phosphor ghost on hover/focus, history commit, and status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 25: Restored multi-select stroke inspector (mixed-path-dash) after placeholder corruption, then added Soft / Default / Sharp / Hard miter-limit presets. Presets write miter + force join=miter on selected outlines, phosphor ghost on hover, active highlight when matched, history commit, and status strip. Dash presets also gained active state + status. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 19: Guide distribute / equal-gap from the command palette. "Distribute guides evenly" command spaces selected (or all) guides of each axis evenly between extremes, with history commit and status. Also available via the Print inspector Even button. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 18: Layer filter matches group contents and path points. Filtering now keeps hierarchy: a layer shows if it or any descendant matches name/kind/text or path-point coordinates. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 17: Single-node stroke dash presets (Solid / Dash / Dot / Long / Gap) in the Appearance stroke section. Click applies dash + offset with history commit; hover/focus shows phosphor ghost on canvas. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 16: Single-node stroke inspector extended with dash, offset, line cap, line join, and miter limit controls (when join is miter). Scrub ranges set live canvas phosphor overlays via strokeDashScrubId / strokeDashOffsetScrubId / miterLimitScrubId and strokeGhost. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 14: Guide look presets in the command palette (Phosphor dash / Ice solid / Amber tight / Magenta dash) plus Reset guide look (color + dash). Shared GUIDE_LOOK_PRESETS. Status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 15: Single-node stroke inspector. Color picker + width field + recent colour swatches under the stroke color in the Appearance section (when one layer is selected). Picks remember to recent colours. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 1: Added persistent recent colors swatches in the fill inspector. Colors used in solid fills or gradient stops are remembered (up to 8, localStorage) and shown as clickable chips under the color picker. Multi-select ink also records them.
- Iteration 2: Polished recent colours — live-updating chips (event-driven), clear button, hover ring, and recent swatches now appear for multi-select fill/stroke and type colour. Stroke, shadow, and brush colours are also remembered.
- Iteration 3: Layer search focus + keyboard jump. Cmd/Ctrl+F focuses the layers filter. While filtering, ↑/↓ cycle matching layers (select + scroll into view), Enter commits the current match, Esc clears.
- Iteration 4: Copy / paste style. Copies fill, stroke, opacity, blend from the first selected layer; paste applies them to the selection with history commit. Mixed detection covers the new stroke fields.
- Iteration 5: Style copy/paste now carries shadow. Copy from first selected layer; paste applies with history commit.
- Iteration 6: Artboard guides lock/unlock bulk action. Lock/Unlock buttons in the guides toolbar apply to the selection (or all when none selected). History commit + status.
- Iteration 6b: Polished guides lock — Lock/Unlock now apply to all guides when none are selected; history commit + status strip feedback; patchGuide commits for undo.
- Iteration 7: Guide labels editable in the inspector list. Optional short name (max 32) on each guide, committed for undo, status feedback. Labels draw near the guide on the canvas when set.
- Iteration 8: Per-guide color override. Color swatch in the guides list cycles the palette (or clears). Canvas and labels draw with the override via resolveGuideStroke. Status + undo commit.
- Iteration 9: Per-guide dash override. Dash chip in the guides list cycles solid/dash/tight (or clears on repeat). Drawing uses the override via resolveGuideStroke. Status + undo commit. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 10: Bulk dash apply for guides. Dash / Tight / Solid / None buttons in the guides toolbar set the dash override on the selection (or all guides when none are selected). History commit + status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 11: Bulk color apply for guides. Color swatches + Clear in the guides toolbar set the color override on the selection (or all guides when none are selected). History commit + status strip. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 12: Style paste now also includes stroke dash, dash offset, line cap, line join, and miter limit. Copy from first selected layer; paste applies them with history commit. Mixed detection covers the new stroke fields. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- Iteration 13: Guide color + dash combined bulk presets. Cyan dash / Ice tight / Phos solid / Mag dash buttons plus Reset look in the guides toolbar apply both overrides in one history commit (selection or all). Status strip feedback. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

## Iteration
- 2026-11-21T20:05:00Z — Layer filter highlight matching text/points in the list. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T19:05:00Z — Single-node dash named presets active state (Solid / Dash / Dot / Long / Gap). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T18:10:00Z — Single-node dash pattern numeric chips (0 / 4 / 8 / 16). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T16:06:00Z — Single-node dash offset numeric chips (0 / 2 / 4 / 8 / -4). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T07:08:39Z — Single-node miter-limit presets (Soft / Default / Sharp / Hard). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T06:04:55Z — Single-node line-cap / join preset chips (Butt/Round/Square, Miter/Round/Bevel). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T05:05:00Z — Single-node named stroke width presets (Hair / Fine / Medium / Bold). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T04:05:14Z — Single-node stroke width numeric quick chips (0.5 / 1.5 / 3 / 6). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T03:04:54Z — Multi-select dash pattern numeric chips (0 / 4 / 8 / 16). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T02:06:33Z — Multi-select dash offset numeric chips (0 / 2 / 4 / 8 / -4). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T01:05:00Z — Multi-select stroke width numeric quick chips (0.5 / 1.5 / 3 / 6) alongside named presets. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-21T00:08:32Z — Multi-select stroke width presets (Hair / Fine / Medium / Bold). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-20T23:14:14Z — Multi-select line-cap / join preset chips with icons (Butt/Round/Square, Miter/Round/Bevel), active state, phosphor ghost, status. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-20T06:06:19Z — Guide distribute from command palette. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-20T05:06:00Z — Layer filter matches group contents / path points (hierarchy preserved; name/kind/text/coords). Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-20T04:09:02Z — Stroke dash pattern presets in single-node inspector. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

## Next recommended
- Or: guide equal-gap numeric input in the inspector.
- Or: single-node stroke width named presets polish or multi-select consistency.
- Or: layer filter highlight polish (multi-match, case, or jump-to-match scroll).
