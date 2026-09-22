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
