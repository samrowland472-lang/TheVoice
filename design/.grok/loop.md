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

1. Present notes persist across sibling jumps without an extra Save.
2. Chip menu: unlink / delete last page with confirm (if UI strip menu is missing on this build).

## Done

- Restored `store-impl.ts` so campaign, persist, and studio actions resolve.
- Confirm-before-delete when the last page of a campaign is removed (strip menu + hub trash).
- Chip menu: duplicate, unlink, delete page.
- `writeCampaignOrder` keeps remaining strip positions after unlink/delete.
- `duplicateCampaignPage` clones the open board into the same set.
- Drag-reorder campaign chips; `reorderCampaignPages` writes `campaignOrder` from the new strip sequence.
- Double-click a chip to rename the page.

## Iteration

2026-09-20 10:15 BST — Drag-reorder campaign chips and persist campaignOrder from the strip.

## Next recommended

Present notes persist across sibling jumps without an extra Save.
