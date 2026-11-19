# The Voice Design — Improvement Loop

## Done
- Iteration 1: Added persistent recent colors swatches in the fill inspector. Colors used in solid fills or gradient stops are remembered (up to 8, localStorage) and shown as clickable chips under the color picker. Multi-select ink also records them.
- Iteration 2: Polished recent colours — live-updating chips (event-driven), clear button, hover ring, and recent swatches now appear for multi-select fill/stroke and type colour. Stroke, shadow, and brush colours are also remembered.
- Iteration 3: Layer search focus + keyboard jump. Cmd/Ctrl+F focuses the layers filter. While filtering, ↑/↓ cycle matching layers (select + scroll into view), Enter commits the current match, Esc clears.

## Iteration
- 2026-11-19T02:15:00Z — Recent colors slice. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.
- 2026-11-19T03:05:45Z — Recent colours polish. Reactive chips + clear + broader coverage (stroke/shadow/brush/type). Auth OFF, DB OFF, localStorage only.
- 2026-11-19T04:06:00Z — Layer search focus + keyboard jump to matching layers. Auth OFF, DB OFF, localStorage only. Phosphor-on-ground intact.

## Next recommended
- Copy/paste style (fill + stroke + opacity + blend) as a command.
- Or: artboard guides lock/unlock bulk action.
- Or: recent colours also in the single-node stroke inspector if one exists.
- Or: layer filter also matches group contents / path points.
