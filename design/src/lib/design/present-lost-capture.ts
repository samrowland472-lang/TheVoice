import {
  peekAfterLostCapture as peekAfterLostCaptureBase,
  peekCaptionAfterMutedPointerUpCurrentHover,
  peekCaptionAfterQuietEscape,
  peekCaptionNameId,
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

/** Quiet Escape after keep-clear while Shift is held stays in present; keep stays dead. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld(opts: {
  key: string;
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
  const quiet = peekCaptionAfterQuietEscapeAfterKeepClear({
    key: opts.key,
    shiftHeld: true,
    muted: opts.muted,
    namedId: opts.namedId,
    mutedPointerUpKeep: false,
  });
  return {
    ...quiet,
    stayInPresent: opts.key === "Escape" ? true : quiet.stayInPresent,
    mutedPointerUpKeep: false,
  };
}

/** Later current-dot hover after that quiet Escape names the live frame; keep stays dead. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldCurrentHover(opts: {
  key: string;
  muted: boolean;
  namedId: string | null;
  hoveringCurrent: boolean;
  currentId: string | null;
}): {
  namedId: string | null;
  muted: boolean;
  showCaption: boolean;
  stayInPresent: boolean;
  mutedPointerUpKeep: boolean;
} {
  const quiet = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld({
    key: opts.key,
    muted: opts.muted,
    namedId: opts.namedId,
  });
  const hover = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: opts.hoveringCurrent,
    muted: quiet.muted,
    namedId: quiet.namedId,
    currentId: opts.currentId,
    mutedPointerUpKeep: quiet.mutedPointerUpKeep,
  });
  return {
    namedId: hover.namedId,
    muted: hover.muted,
    showCaption: hover.showCaption,
    stayInPresent: quiet.stayInPresent,
    mutedPointerUpKeep: hover.mutedPointerUpKeep,
  };
}

type KeepClearReleaseOpts = {
  muted: boolean;
  namedId: string | null;
  fallbackId: string | null;
  offCurrentNamedId?: string | null;
};

type KeepClearReleaseResult = {
  muted: boolean;
  namedId: string | null;
  showCaption: boolean;
  captionId: string | null;
  mutedPointerUpKeep: boolean;
};

/** Shift-release after that quiet Escape stays muted until an off-current tick is named. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  const off = opts.offCurrentNamedId ?? null;
  if (off) {
    return {
      muted: false,
      namedId: off,
      showCaption: true,
      captionId: off,
      mutedPointerUpKeep: false,
    };
  }
  return {
    muted: true,
    namedId: null,
    showCaption: false,
    captionId: peekCaptionNameId({
      muted: true,
      namedId: null,
      fallbackId: opts.fallbackId,
    }),
    mutedPointerUpKeep: false,
  };
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(opts);
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur(opts);
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel(opts);
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture(opts);
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp(opts);
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave(opts);
}

export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOut(opts);
}

/** Document pointer-over after the muted keep-clear Shift-held path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerEnter(opts);
}

/** Document pointer-move after the muted keep-clear Shift-held path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerOver(opts);
}

/** Document pointer-down after the muted keep-clear Shift-held path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerDown(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerMove(opts);
}

/** Document pointer-cancel after the muted keep-clear Shift-held pointer-down path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerCancel(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerDown(opts);
}

/** Document lostpointercapture after the muted keep-clear Shift-held path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocLostPointerCapture(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerCancel(opts);
}

/** Document pointer-up after the muted keep-clear Shift-held path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocLostPointerCapture(opts);
}

/** Second document pointer-down after that muted path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp(opts);
}

/** Second document pointer-move after the muted document pointer-down path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerMove(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown(opts);
}

/** Second document pointer-leave after the muted document pointer-move path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerLeave(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerMove(opts);
}

/** Second document pointer-out after the muted document pointer-leave path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerOut(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerLeave(opts);
}

/** Second document pointer-enter after the muted document pointer-out path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerEnter(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerOut(opts);
}

/** Second document pointer-over after the muted document pointer-enter path stays muted. */
export function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerOver(
  opts: KeepClearReleaseOpts,
): KeepClearReleaseResult {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerEnter(opts);
}
