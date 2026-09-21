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

1. Present-mode idle chrome: pointer activity or F reveals the campaign rail (notes keep it visible).
2. Wire caret restore in the notes textarea from NOTES_CARET.

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
- Present-mode page dots: right-click menu with rename, duplicate, unlink, delete last page (confirm).
- Campaign strip keyboard reorder: Alt+Left / Alt+Right on a chip (or while the open page is in a set) calls `nudgeCampaignPage` and writes `campaignOrder`.
- Present-mode page dots drag-reorder via `PresentChipRail` (`reorderCampaignPages` / `campaignOrder`).
- Present chrome uses `PresentChipRail` instead of inert dots.
- Typecheck: AI text nodes include stroke style fields; render default branch is typed.
- Present-mode page dots: Tab-focusable; Alt+Left / Alt+Right on a focused dot calls `nudgeCampaignPage` (same as the campaign strip). Focus-visible phosphor ring.
- Present chrome uses `PresentChipRail` again (drag / context / Alt-reorder + active-dot phosphor halo).
- Present-mode speaker notes: N toggles the drawer and focuses the field; Escape closes notes first, then exits present.
- Present-mode notes drawer persists caret per page and shows a last-edited page hint.
- Present-mode fullscreen (F): requestFullscreen on the present root so the campaign chip rail stays on screen. Exit present also leaves fullscreen.
- Present-mode notes: opening notes (N) from another campaign frame restores the last-edited page; caret and last-edit hint persist.
- Present-mode chrome hides after idle; pointer activity or F reveals the campaign rail. Notes keep the bar visible. F while hidden only reveals; F while visible still toggles fullscreen.
- Present-mode notes stay on the current frame; Jump to last opens the page whose notes were last edited.

## Iteration

2026-09-21 09:37 BST — Present notes jump-to-last control (no forced restore).

## Next recommended

Present-mode idle chrome: pointer activity or F reveals the campaign rail (notes keep it visible).
