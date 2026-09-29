# The Voice Design — 100-hour improvement loop

## Iteration

2026-09-29 12:05 BST — Present peek chrome is on the stage again. Hairline + page dots stay when the rail hides; scrub, Shift names, double-click notes, and quiet Escape all work against the live helpers. SVG export entities compile. placeNodes is typed.

## Next recommended

Present notes jump chip in the peek drawer. Campaign PDF stack still worth a smoke in Present.

## Done

- Restored data-present-peek strip with phosphor hairline (`bg-phosphor/55` + lift glow).
- Peek dots jump frames, current hover shows index, Shift names the next / pointed frame.
- Scrub writes peekTickId / last-other ghost; fade uses peekTickOpacity + PEEK_TICK_FADE_MS.
- Double-click peek opens quiet notes; Escape closes them without leaving Present.
- export.ts esc() writes &amp; &lt; &gt; &quot;.
- store-impl.placeNodes typed as { id, x, y }[].
- applyIsolate empty keepIds = Show all; isolate switch from snapshot.
