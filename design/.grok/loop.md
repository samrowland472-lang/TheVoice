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

1. Boolean apply on 3+ mixed compounds should keep hole ownership when an island sits inside a punched hole.
2. Align / distribute on converted path islands.

## Done

- Boolean preview keeps nested holes when offset rings mix with type-converted paths. Island grouping walks nearest-parent depth so a hole stays a hole instead of a second filled island. Hover Union/Subtract/Intersect/Exclude draws every resulting island with evenodd punches.
- Knife live preview: hover marks the nick; drag draws a phosphor cut line and ticks every crossing. Click still nicks one. Drag-across splits closed rings into open pieces and lifts cut holes. Knife wired on the artboard (K).

## Iterations

### 2026-09-02T05:25Z — loop 122

**Boolean preview holes on mixed compounds.** Nested offset rings plus type-converted letters no longer fill their counters in the hover ghost. `groupIslands` parents each ring to the smallest container and treats odd depth as a hole. Canvas traces every boolean part with evenodd fill.

### 2026-09-02T04:20Z — loop 121

**Knife live preview.** The knife tool is live on the artboard.

## Next recommended

Boolean apply on three-plus mixed compounds: keep hole ownership when an island lives inside a punched hole.
