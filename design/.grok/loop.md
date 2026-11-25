# The Voice Design · Improvement Loop

## Done
- 2026-11-25T21:05Z — Radial value chips scale + glow parity with linear: Inner / Centre / Focal phosphor chips now grow (13.5px font, taller plate, stronger dual glow, brighter stroke/text) and position near their handles when gradientHoverKey is "r0" / "centre" / "focal". Inspector hover and on-canvas drag both drive the emphasis; cleared on commit. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-25T19:15Z — Radial gradient handles scale + glow parity with linear: centre cross, focal diamond, and r0 circle grow (~1.6–1.7×) with brighter fill and outer phosphor ring when gradientHoverKey is "centre" / "focal" / "r0". Inspector hover on Centre/Focal/Inner fields and on-canvas drag both drive the emphasis; cleared on commit. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-25T18:05Z — Active on-canvas linear handles scale + glow: end circle (length/angle) grows to ~1.85× with brighter fill and outer phosphor ring; centre diamond (offset) grows to ~1.8× with brighter fill and outer glow. Connecting line brightens when length or angle is focused. Dragging the end handle now sets gradientHoverKey to "length" (offset diamond sets "offset") so the emphasis appears live during drag; cleared on commit. Inspector hover still drives the same. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-25T17:15Z — Focused linear gradient chips scale larger + brighter: phosphor value chips for ∠ / Len / Offset now grow (13.5px font, taller plate, stronger dual glow, brighter stroke/text) and draw last when gradientHoverKey matches. Inspector hover and on-canvas drag both drive the emphasis. Restored full canvas-stage (was truncated stub). Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-25T09:24Z — Active-dimension gradient chips + status: separate phosphor chips on linear handles (∠ at centre, Len at end, Offset under centre) now draw the focused dimension last (on top). Dragging end handle sets gradientHoverKey "length"; offset diamond sets "offset". Status denser (`∠° · Len %`, `Offset x%, y%`). Hover key cleared on commit. Inspector hover still drives the same focus. Typecheck, build, smoke clean (hub content visible, canvas present).
- 2026-11-25T08:02Z — Hover-highlight on-canvas linear length/offset handles from inspector fields.
- 2026-11-25T07:06Z — Combined live gradient chips for angle/length/offset.
- 2026-11-25T06:17Z — Inspector fields for linear length and offset.
- 2026-11-25T05:09Z — On-canvas linear gradient length / offset handle.

## Next recommended
- Separate angle-only vs length-only end-handle modes (e.g. modifier key)
- Multi-stop gradient editing on-canvas (add/remove/reorder stops)

## Backlog
23. Inspector fields for linear length and offset (done)
22. On-canvas linear gradient angle handle for mixed selections (done)
21. Gradient stop editing in mixed selection (done)
20. Context-aware / denser gradient dimension chips (done this pass)
