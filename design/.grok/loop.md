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

1. Reorder campaign pages on the strip. *(shipped this pass)*
2. Present mode page dots that match the strip order after a manual reorder.
3. Campaign page overflow menu (delete from set / unlink).

## Done

- Restored `store-impl.ts` (was an 11-byte PLACEHOLDER) so campaign, persist, and studio actions resolve again.
- Drag a campaign strip chip onto another chip to reorder the set; ‹ › nudge the open page. Order is `campaignOrder` in localStorage.
- `campaignPages` prefers explicit order, then story → square → banner → other.
- Double-click a campaign strip chip to rename that page; Enter or blur commits, Escape cancels. Sibling names persist in localStorage.
- Present mode draws page dots in campaignPages order; click a dot to jump.
- Duplicate on the campaign strip clones the open board into the same `campaignId` and jumps to it.
- Campaign strip actually tags a set: Campaign creates story + square + banner siblings that share `campaignId`.
- Add page from the strip stays in the set; chips jump sibling artboards without the hub.
- Last-opened id is written on open / new / template; hub resumes it unless Back marked stay-on-hub for the tab.
- Pair captions on the board take the axis look color, and Print V/H chips preview that color on hover.
- Rail Print hides the guide name field behind a disclosure; click the caption to edit.
- Restored Print guide rows: lock / hide / del, name, color + dash chips, V/H axis looks.
- Store owns printMarks, bleed edges, patchGuide, renameGuide, hover previews.
- Locked guides refuse move/delete; hidden skip the board and hit-tests.
- Board strokes use resolveGuideStroke + dashArray + color/dash hover preview.
- Print section can collapse to a rail; T/R/B/L bleed edge chips stay on the rail with print-marks toggle.
- Click a bleed chip to cycle that edge through None / 3 mm / 6 mm; rail choice persists in localStorage.
- InspectorPrint is mounted under Artboard so print bleed is reachable without a selection.
- Guide color tokens: mint, amber, magenta, violet, bone plus cyan / ice / phosphor.

## Iteration

2026-09-20 06:10 BST — Reorder campaign pages on the strip; restore store-impl.

## Next recommended

Present dots already share `campaignPages`; next slice can add unlink / remove-from-set on the strip.
