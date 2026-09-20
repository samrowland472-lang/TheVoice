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

1. Present-mode chip menu parity (unlink / delete last page).
2. Campaign strip keyboard reorder (Alt+Left / Alt+Right).

## Done

- Restored the Zustand store (`store-impl.ts`) so campaign, persist, and studio actions resolve.
- Campaign chip context menu: rename, duplicate, unlink, delete page.
- Confirm-before-delete when the last page of a campaign is removed (strip menu + hub trash).
- `writeCampaignOrder` keeps remaining strip positions after unlink/delete.
- `duplicateCampaignPage` clones the open board into the same set.
- Speaker notes persist immediately on edit (`setNotes` writes the artboard).
- Chip menu: duplicate, unlink, delete page.
- Double-click a chip to rename the page.
- Drag-reorder campaign chips; drop writes `campaignOrder` via `reorderCampaignPages` / `writeCampaignOrder`.

## Iteration

2026-09-20 15:45 BST — Drag-reorder campaign chips with live campaignOrder write.

## Next recommended

Present-mode chip menu parity (unlink / delete last page).
