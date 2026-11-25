# The Voice Design · Improvement Loop

## Done
- 2026-11-25T08:02Z — Hover-highlight on-canvas linear length/offset handles from inspector fields: hovering Length % range (single or mixed) or Offset X/Y fields sets gradientHoverKey to "length" or "offset". Canvas end-handle circle enlarges + glow for length; centre diamond enlarges + brighter fill for offset. Combined phosphor value chip (∠angle° · length% · ox,oy) appears on hover for all three. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T07:06Z — Combined live gradient chips: on-canvas value chip while scrubbing linear angle/length or offset handles (or hovering angle) now shows ∠angle° · length% · ox,oy in one phosphor chip (previously angle-only). Status already matched. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T06:17Z — Inspector fields for linear length and offset: single-selection FillEditor gains Length % (20–300), Offset X %, and Offset Y % sliders + NumFields for linear fills (matching radial Centre/Focal pattern). Mixed uniform linear selections gain Ang/Len ranges and OX/OY NumFields that write to every selected node. Typecheck, build, smoke clean (hub content visible).
- 2026-11-25T05:09Z — On-canvas linear gradient length / offset handle: end handle now also scrubs relative length (llen, 20–300%); phosphor diamond at gradient centre drags to offset the line (lox/loy 0–100%). Shared across uniform mixed selections. Live status shows angle · length or offset %. Typecheck, build, smoke clean (hub content visible).

## Next recommended
- Denser separate chips or cursor-following value while dragging length vs offset
- Live status polish for linear offset/length drags

## Backlog
23. Inspector fields for linear length and offset (done)
22. On-canvas linear gradient angle handle for mixed selections (done)
21. Gradient stop editing in mixed selection (done)
