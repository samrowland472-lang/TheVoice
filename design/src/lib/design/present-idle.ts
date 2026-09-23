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

export function peekNamedIdForPointer(opts: {
  shiftHeld: boolean;
  scrubbing: boolean;
  underPointerId: string | null;
  currentId: string | null;
}): string | null {
  if (!opts.shiftHeld || !opts.underPointerId) return null;
  if (!opts.scrubbing && opts.currentId && opts.underPointerId === opts.currentId) return null;
  return opts.underPointerId;
}

export function peekCaptionAfterQuietHomeEnd(opts: {
  namedId: string | null;
  key: string;
  shiftHeld: boolean;
}): { namedId: string | null; showCaption: boolean; muted: boolean } {
  if (opts.key !== "Home" && opts.key !== "End") {
    return { namedId: opts.namedId, showCaption: opts.shiftHeld, muted: false };
  }
  return { namedId: null, showCaption: false, muted: true };
}

export function peekCaptionAfterShiftHover(opts: {
  muted: boolean;
  namedId: string | null;
}): { muted: boolean; namedId: string | null } {
  if (!opts.namedId) return { muted: opts.muted, namedId: null };
  return { muted: false, namedId: opts.namedId };
}

export function peekCaptionNameId(opts: {
  muted: boolean;
  namedId: string | null;
  fallbackId: string | null;
}): string | null {
  if (opts.namedId) return opts.namedId;
  if (opts.muted) return null;
  return opts.fallbackId;
}

export function peekCaptionAfterCurrentDotHover(opts: {
  muted: boolean;
  hoveringCurrent: boolean;
  namedId: string | null;
  scrubbing?: boolean;
}): { muted: boolean; namedId: string | null } {
  if (opts.scrubbing) return { muted: opts.muted, namedId: opts.namedId };
  if (!opts.hoveringCurrent) return { muted: opts.muted, namedId: opts.namedId };
  return { muted: opts.muted, namedId: null };
}

export function peekCaptionAfterLeaveCurrentDot(opts: {
  muted: boolean;
  namedId: string | null;
}): { muted: boolean; namedId: string | null } {
  if (opts.namedId) return { muted: false, namedId: opts.namedId };
  return { muted: false, namedId: null };
}

export function peekCaptionAfterMutedScrub(opts: {
  muted: boolean;
  scrubbing: boolean;
  underPointerId: string | null;
}): { muted: boolean; namedId: string | null } {
  if (!opts.scrubbing) return { muted: opts.muted, namedId: null };
  if (!opts.underPointerId) return { muted: true, namedId: null };
  return { muted: false, namedId: opts.underPointerId };
}

export function peekCaptionAfterShiftRelease(opts: {
  shiftHeld: boolean;
  scrubbing: boolean;
  namedId: string | null;
  muted: boolean;
}): { namedId: string | null; muted: boolean; showCaption: boolean } {
  if (opts.shiftHeld) {
    return {
      namedId: opts.namedId,
      muted: opts.muted,
      showCaption: Boolean(opts.namedId) || !opts.muted,
    };
  }
  if (opts.scrubbing || opts.namedId || opts.muted) {
    return { namedId: null, muted: true, showCaption: false };
  }
  return { namedId: null, muted: false, showCaption: false };
}

/** Pointer-up after a muted Shift-scrub keeps mute — the named caption stays dead. */
export function peekCaptionAfterMutedPointerUp(opts: {
  muted: boolean;
  namedId: string | null;
}): { muted: boolean; namedId: string | null; showCaption: boolean } {
  if (opts.muted) {
    return { muted: true, namedId: null, showCaption: false };
  }
  return {
    muted: false,
    namedId: opts.namedId,
    showCaption: Boolean(opts.namedId),
  };
}

/** Pointer-up after a muted scrub keeps the landed tick (not the current-page hide). */
export function peekTickAfterMutedPointerUp(opts: {
  tickId: string | null;
  landedId: string | null;
  muted: boolean;
}): string | null {
  const keep = opts.tickId ?? opts.landedId;
  if (!keep) return null;
  if (opts.muted) return keep;
  return opts.tickId;
}
