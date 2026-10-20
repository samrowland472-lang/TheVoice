## Iteration

2026-10-20 19:05 BST — Added centered contextual hints for the brush and eraser tools on the canvas stage. Phosphor text, no chrome. Shows drag action, [ ] resize shortcut, current size, and flow. Existing left tool chip and pen/select/knife hints unchanged.

## Done

- Subscribed CanvasStage to brush state and rendered non-interactive absolute hints when tool is brush or eraser and not in present mode.
- Typecheck, build, and browser-smoke all green. Screenshots confirm canvas and status text present with no console errors.

## Backlog

- None remaining on the seating comment unrolls.
- Optional: bind single-letter keys for polygon / star / arrow / image if desired.

## Next recommended

Small visual polish on the inspector or layers panel, or bind the optional single-letter tool keys.
