# The Voice Design — Improvement Loop

## Iteration
- **When**: 2026-10-23 08:05 UTC
- **Slice**: Photo filter and shadow-blur ranges show live phosphor track fill
- **Status**: Done

## Done
- Photo filter ranges (Brightness, Contrast, Saturate, Blur) in the single-layer Photo inspector and the mixed Photos strip now draw a phosphor-to-ground track fill whose length and intensity follow the normalized value.
- Layer shadow Blur range uses the same treatment.
- CSS uses `[data-fill-range]` + `--fill-percent` so opacity ranges keep their dedicated `--fill-opacity` path.
- Opacity tracks, mixed ticks, keyboard commit, and all other solid phosphor ranges unchanged.
- Typecheck clean. Build clean. Browser smoke clean (desktop + mobile, canvas present, no console errors).

## Next recommended
- Keyboard Home/End on the range inputs themselves.
- Small opacity histogram legend when mixed.
- Optional fill for remaining positive ranges (type size, crop edges) with the same percent variable.

## Guardrails observed
- Auth OFF, DB OFF, localStorage only.
- Phosphor styling, no emoji chrome, no second brand.
- One vertical slice only.
