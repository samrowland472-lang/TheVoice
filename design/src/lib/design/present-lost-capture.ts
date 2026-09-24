import {
  peekAfterLostCapture as peekAfterLostCaptureBase,
  peekCaptionAfterMutedPointerUpCurrentHover,
  peekCaptionAfterQuietEscape,
} from "./present-idle";

export function peekAfterLostCaptureKeep(opts: {
  muted: boolean;
  namedId: string | null;
  tickId: string | null;
  landedId: string | null;
  mutedPointerUpKeep?: boolean;
}) {
  const lost = peekAfterLostCaptureBase({
    muted: opts.muted,
    namedId: opts.namedId,
    tickId: opts.tickId,
    landedId: opts.landedId,
  });
  return {
    ...lost,
    mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
  };
}

export function peekCaptionAfterLeaveOffCurrentNamedTick(opts: {
  namedId: string | null;
  currentId: string | null;
  muted: boolean;
  mutedPointerUpKeep?: boolean;
}): { muted: boolean; namedId: string | null; showCaption: boolean; mutedPointerUpKeep: boolean } {
  const off = opts.namedId && opts.currentId && opts.namedId !== opts.currentId ? opts.namedId : null;
  if (off && !opts.mutedPointerUpKeep) {
    return { muted: false, namedId: null, showCaption: false, mutedPointerUpKeep: false };
  }
  if (opts.mutedPointerUpKeep) {
    return { muted: true, namedId: null, showCaption: false, mutedPointerUpKeep: true };
  }
  return {
    muted: opts.muted,
    namedId: opts.namedId,
    showCaption: Boolean(opts.namedId) && !opts.muted,
    mutedPointerUpKeep: false,
  };
}

/** Window blur mid-scrub after keep-clear shares this helper so the current-dot name stays live. */
export function applyWindowBlur(opts: { scrubbing: boolean }) {
  return { endScrub: opts.scrubbing, nameCurrentDot: true };
}

export function peekCaptionAfterLostCaptureCurrentHover(opts: {
  muted: boolean;
  namedId: string | null;
  hoveringCurrent: boolean;
  currentId: string | null;
  mutedPointerUpKeep?: boolean;
}): { muted: boolean; namedId: string | null; showCaption: boolean; mutedPointerUpKeep: boolean } {
  const lost = peekAfterLostCaptureKeep({
    muted: opts.muted,
    namedId: opts.namedId,
    tickId: null,
    landedId: opts.currentId,
    mutedPointerUpKeep: opts.mutedPointerUpKeep,
  });
  return peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: opts.hoveringCurrent,
    muted: lost.muted,
    namedId: lost.namedId,
    currentId: opts.currentId,
    mutedPointerUpKeep: lost.mutedPointerUpKeep,
  });
}

/** Quiet Escape after window-blur keep-clear must not revive mutedPointerUpKeep. */
export function peekCaptionAfterQuietEscapeAfterKeepClear(opts: {
  key: string;
  shiftHeld: boolean;
  muted: boolean;
  namedId: string | null;
  mutedPointerUpKeep?: boolean;
}): {
  namedId: string | null;
  muted: boolean;
  showCaption: boolean;
  stayInPresent: boolean;
  mutedPointerUpKeep: boolean;
} {
  const quiet = peekCaptionAfterQuietEscape({
    key: opts.key,
    shiftHeld: opts.shiftHeld,
    muted: opts.muted,
    namedId: opts.namedId,
  });
  return {
    ...quiet,
    mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
  };
}
