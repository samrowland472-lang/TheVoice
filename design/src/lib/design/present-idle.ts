/** Hide present chrome after idle; any activity or F reveals the campaign rail. */

export const PRESENT_IDLE_MS = 2800;

export function shouldHidePresentChrome(opts: {
  idle: boolean;
  notesOpen: boolean;
  menuOpen: boolean;
}): boolean {
  if (opts.notesOpen || opts.menuOpen) return false;
  return opts.idle;
}

/** Thin hairline + page-dot peek stay when the rail is hidden so the deck is findable. */
export function shouldShowPresentPeek(opts: {
  hideChrome: boolean;
  pageCount: number;
}): boolean {
  return opts.hideChrome && opts.pageCount > 0;
}

/** Frame-advance keys keep peek visible — they must not wake the campaign rail. */
export function isQuietPresentNavKey(key: string): boolean {
  return (
    key === "ArrowRight" ||
    key === "ArrowLeft" ||
    key === " " ||
    key === "PageDown" ||
    key === "PageUp" ||
    key === "Home" ||
    key === "End" ||
    key === "Shift"
  );
}

/** Peek strip pointer work stays quiet so scrubbing does not wake the rail. */
export function isQuietPresentPeekTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-present-peek]"));
}

/** Map a pointer X inside the peek strip to a frame index. */
export function peekScrubIndex(clientX: number, stripLeft: number, stripWidth: number, pageCount: number): number {
  if (pageCount <= 0) return 0;
  if (stripWidth <= 0) return 0;
  const t = (clientX - stripLeft) / stripWidth;
  const i = Math.floor(t * pageCount);
  return Math.max(0, Math.min(pageCount - 1, i));
}

/** After a drag-scrub, keep a tick on the last frame only if the pointer actually moved. */
export function peekScrubTickId(startId: string | null, endId: string | null): string | null {
  if (!endId || !startId || startId === endId) return null;
  return endId;
}

/** Last-frame tick fades if you stay on the landed frame. */
export const PEEK_TICK_FADE_MS = 3200;

export function peekTickAfterDwell(
  tickId: string | null,
  dwellMs: number,
  fadeMs: number = PEEK_TICK_FADE_MS,
): string | null {
  if (!tickId) return null;
  if (dwellMs >= fadeMs) return null;
  return tickId;
}

/** Quiet frame-advance keys drop the last-frame tick so it is not a second current-dot. */
export function peekTickAfterQuietAdvance(tickId: string | null, key: string): string | null {
  if (!tickId) return null;
  if (isQuietPresentNavKey(key) && key !== "Shift") return null;
  return tickId;
}

/** Quiet click of a different peek dot also drops the last-frame tick. */
export function peekTickAfterQuietDotClick(
  tickId: string | null,
  clickedId: string | null,
  currentId: string | null,
): string | null {
  if (!tickId) return null;
  if (clickedId && currentId && clickedId !== currentId) return null;
  return tickId;
}
