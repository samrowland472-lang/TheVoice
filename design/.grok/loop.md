# The Voice Design — 100-hour improvement loop

Automated, recurring quality loop. Each run ships **one coherent slice**, verifies it, then stops.
Do **not** scaffold a new app. Do **not** add auth or a database. Visual language stays phosphor-on-ground.

## Cadence

Every **5 minutes**. After each successful slice, **push to GitHub** `samrowland472-lang/TheVoice` on `main` under `design/`.
If the previous iteration is < 4 minutes old, polish that slice or skip. Never push empty/placeholder files.

## GitHub (required)

Repo of record: **https://github.com/samrowland472-lang/TheVoice** — folder `design/`.
Confirm file sizes after push (`types.ts` / `store.ts` / `render.ts` / `canvas-stage.tsx` / `export.ts` must be KB, not 11 bytes).

## Product

**The Voice Design** — local-first graphic studio (hub + artboard).
TanStack Start, Zustand, canvas renderer, `localStorage` persistence.
Auth OFF, DB OFF.

## Backlog (priority order)

1. Guide lock / hide per guide.
2. Distribute selected guides evenly.
3. Guide color / style per axis.

## Done

- Multi-guide select + nudge: click a guide on the board or in Print (Shift to add), phosphor highlight, arrow keys nudge (Shift 10 / Alt 0.5), Delete removes the selection. Adding a guide selects it. Object select clears guide select.
- Guide pair spacing: consecutive parallel guides draw equal-gap ticks and a numeric gap on the artboard; Print inspector lists V/H pair gaps. Live drag highlights the pair that includes the moving guide.
- Guide distance readout while dragging: nearest object / artboard / sibling-guide gap on each side, drawn on the artboard and in the Print inspector.
- Guide snap-to-object: dragging a guide from the inspector V/H handle or on the artboard snaps to object edges/centers and artboard midlines when Snap is on (hold Alt to bypass). Numeric commit in the guide list also snaps.
- Present-mode Safe / Marks chrome: present bar chips plus S / M shortcuts toggle live safe-area inset and crop / bleed marks. Canvas draws those overlays in editor and present. Prefs persist. Command palette Show / hide.
- Inspector Print + Guides: None/3 mm/6 mm chips highlight uniform bleed; T/R/B/L fields write `bleedEdges`; Print marks checkbox + command palette Show/Hide. Live crop marks and bleed band on the artboard; safe-area inset when Safe area is on. Guide list Add V/H, numeric pos, Del, Clear. Prefs persist. `setBleed` writes matching `bleedEdges`.
- Print-mark toggle in inspector + top bar (Crop) draws live crop / registration marks on the artboard.

## Iteration

2026-09-18 11:10 BST — Multi-guide select + arrow-key nudge.

## Next recommended

Guide lock / hide per guide.
