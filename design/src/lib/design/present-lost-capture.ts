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
