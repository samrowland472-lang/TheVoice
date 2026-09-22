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

/**
 * After a drag-scrub, keep a tick on the last distinct frame.
 * Landing back on the start frame still leaves a ghost on the previous frame
 * in the trail instead of dropping it.
 */
export function peekScrubTickId(
  startId: string | null,
  endId: string | null,
  lastOtherId: string | null = null,
): string | null {
  if (!endId || !startId) return null;
  if (startId !== endId) return endId;
  if (lastOtherId && lastOtherId !== endId) return lastOtherId;
  return null;
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

/** Fade clock restarts only when a new scrub lands a tick — not when keys already cleared it. */
export function peekTickFadeShouldRestart(
  prevTickId: string | null,
  nextTickId: string | null,
): boolean {
  if (!nextTickId) return false;
  return prevTickId !== nextTickId;
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

/** Never draw the last-frame tick on the current-dot — it would look doubled. */
export function peekTickShown(tickId: string | null, currentId: string | null): string | null {
  if (!tickId) return null;
  if (currentId && tickId === currentId) return null;
  return tickId;
}

/** Remaining fade dwell in 0..1 — 1 at land, 0 when the clock expires. */
export function peekTickRemaining(dwellMs: number, fadeMs: number = PEEK_TICK_FADE_MS): number {
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) return 1;
  if (dwellMs >= fadeMs) return 0;
  return 1 - dwellMs / fadeMs;
}

/**
 * Trail ticks fall off with page-index distance from the current-dot,
 * then dim further with remaining fade dwell so a far neighbour does
 * not sit at a hard step until it vanishes.
 */
export function peekTickOpacity(distance: number, remaining: number = 1): number {
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  const d = Math.abs(Math.round(distance));
  let step = 0.14;
  if (d === 1) step = 0.7;
  else if (d === 2) step = 0.42;
  else if (d === 3) step = 0.26;
  const t = Number.isFinite(remaining) ? Math.max(0, Math.min(1, remaining)) : 1;
  return step * t;
}

/** Peek double-click notes stay off the campaign rail — Escape must stay quiet too. */
export function isQuietPeekNotesEscape(key: string, peekNotesOpen: boolean): boolean {
  return peekNotesOpen && key === "Escape";
}

/** Fade clock holds while speaker notes are on screen. */
export function peekTickFadePaused(notesVisible: boolean): boolean {
  return notesVisible;
}

/** Elapsed fade time this frame — zero while notes hold the clock. */
export function peekTickDwellDelta(elapsedMs: number, paused: boolean): number {
  if (paused) return 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return elapsedMs;
}
