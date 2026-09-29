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

export function shouldShowPresentPeek(opts: {
  hideChrome: boolean;
  pageCount: number;
}): boolean {
  return opts.hideChrome && opts.pageCount > 0;
}

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

export function isQuietPresentPeekTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-present-peek]"));
}

export function peekScrubIndex(clientX: number, stripLeft: number, stripWidth: number, pageCount: number): number {
  if (pageCount <= 0) return 0;
  if (stripWidth <= 0) return 0;
  const t = (clientX - stripLeft) / stripWidth;
  const i = Math.floor(t * pageCount);
  return Math.max(0, Math.min(pageCount - 1, i));
}

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

export function peekTickFadeShouldRestart(
  prevTickId: string | null,
  nextTickId: string | null,
): boolean {
  if (!nextTickId) return false;
  return prevTickId !== nextTickId;
}

export function peekTickFadeShouldRestartAfterLostCapture(
  prevTickId: string | null,
  nextTickId: string | null,
): boolean {
  return peekTickFadeShouldRestart(prevTickId, nextTickId);
}

export function peekTickAfterQuietAdvance(tickId: string | null, key: string): string | null {
  if (!tickId) return null;
  if (isQuietPresentNavKey(key) && key !== "Shift") return null;
  return tickId;
}

export function peekTickAfterQuietDotClick(
  tickId: string | null,
  clickedId: string | null,
  currentId: string | null,
): string | null {
  if (!tickId) return null;
  if (clickedId && currentId && clickedId !== currentId) return null;
  return tickId;
}

export function peekTickShown(tickId: string | null, currentId: string | null): string | null {
  if (!tickId) return null;
  if (currentId && tickId === currentId) return null;
  return tickId;
}

export function peekTickRemaining(dwellMs: number, fadeMs: number = PEEK_TICK_FADE_MS): number {
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) return 1;
  if (dwellMs >= fadeMs) return 0;
  return 1 - dwellMs / fadeMs;
}

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

/** Named caption uses the same remaining clock as the phosphor ticks. */
export function peekCaptionOpacity(remaining: number): number {
  if (!Number.isFinite(remaining)) return 1;
  return Math.max(0, Math.min(1, remaining));
}

/** Hide the named caption entirely at 0 so no ghost name stays on the strip. */
export function peekCaptionVisible(remaining: number, name: string | null | undefined): boolean {
  if (!name) return false;
  return peekCaptionOpacity(remaining) > 0;
}

export function isQuietPeekNotesEscape(key: string, peekNotesOpen: boolean): boolean {
  return peekNotesOpen && key === "Escape";
}

export function peekTickFadePaused(notesVisible: boolean): boolean {
  return notesVisible;
}

export function peekTickDwellDelta(elapsedMs: number, paused: boolean): number {
  if (paused) return 0;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return elapsedMs;
}
