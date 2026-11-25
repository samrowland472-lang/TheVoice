# The Voice Design · Improvement Loop

## Done
- 2026-11-25T09:24Z — Active-dimension gradient chips + status: separate phosphor chips on linear handles (∠ at centre, Len at end, Offset under centre) now draw the focused dimension last (on top). Dragging end handle sets gradientHoverKey "length"; offset diamond sets "offset". Status denser (`∠° · Len %`, `Offset x%, y%`). Hover key cleared on commit. Inspector hover still drives the same focus. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-25T08:02Z — Hover-highlight on-canvas linear length/offset handles from inspector fields.
- 2026-11-25T07:06Z — Combined live gradient chips for angle/length/offset.
- 2026-11-25T06:17Z — Inspector fields for linear length and offset.
- 2026-11-25T05:09Z — On-canvas linear gradient length / offset handle.

## Next recommended
- Scale active chip slightly larger / brighter when focused
- Separate angle-only vs length-only end-handle modes (e.g. modifier)

## Backlog
23. Inspector fields for linear length and offset (done)
22. On-canvas linear gradient angle handle for mixed selections (done)
21. Gradient stop editing in mixed selection (done)
20. Context-aware / denser gradient dimension chips (done this pass)
