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

1. Campaign page overflow menu (delete from set / unlink). *(shipped this pass)*
2. Persist explicit campaignOrder when unlinking so remaining chips keep their strip positions.
3. Confirm-before-delete on the last page of a set.

## Done

- Restored the missing Zustand store (`store-campaign.ts`) so campaign / persist / studio actions resolve again.
- Campaign strip ··· menu: Unlink from set keeps the artboard as a standalone page; Delete from set removes it and jumps to a sibling (or the hub).
- `saveDoc` writes `campaignId` as stored (so unlink can actually clear it) and keeps `campaignOrder`.

## Iteration

2026-09-20 08:30 BST — Campaign strip overflow: unlink / delete from set; restore store-campaign.

## Next recommended

Keep strip order after unlink. Optional confirm when deleting the last remaining page of a campaign.
