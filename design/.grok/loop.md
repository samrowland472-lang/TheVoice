# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-22 18:06 UTC
- **Slice**: Keyboard focus from the opacity percent field back to the range with arrow keys
- **Status**: Done

## Done
- In the Layer opacity field, ArrowUp and ArrowDown step the selection (Shift steps by 10) and move focus onto the phosphor range so further arrows scrub from there.
- ArrowLeft at the start of the percent field and ArrowRight at the end do the same, without stealing caret movement inside a typed number.
- The range commits those keyboard steps into history. Mixed selections unify on the stepped value.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Live preview of the clipped opacity on the range thumb.
- Show the count in the tick tooltip more prominently, or a small number badge on tall ticks.
- Home and End from the percent field jump the range to 0% or 100%.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
