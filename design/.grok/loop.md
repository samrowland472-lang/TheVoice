## Iteration

2026-10-20 15:05 BST — Added a persistent bottom-left tool chip on the canvas stage that shows the active tool name and its keyboard shortcut (when one exists). Phosphor text, no chrome. Always visible outside present mode. Existing centered pen/select/knife hints unchanged.

## Done

- Introduced TOOL_HINT map and a non-interactive absolute chip in CanvasStage that reads the current tool.
- Typecheck, build, and browser-smoke all green. Screenshots confirm canvas and status text present with no console errors.

## Backlog

- None remaining on the seating comment unrolls.
- Optional: bind single-letter keys for polygon / star / arrow / image if desired.

## Next recommended

Small visual polish on the inspector or layers panel, or surface one more contextual hint for the brush / eraser tools.
