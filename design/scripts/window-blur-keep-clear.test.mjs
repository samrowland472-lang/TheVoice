import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-lost-capture.ts", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/components/studio/present-peek-pointer.ts", import.meta.url), "utf8");

function peekCaptionNameId(opts) {
  if (opts.namedId) return opts.namedId;
  if (opts.muted) return null;
  return opts.fallbackId;
}

function peekCaptionAfterMutedPointerUpCurrentHover(opts) {
  const off = opts.offCurrentNamedId ?? null;
  if (off) {
    return { muted: false, namedId: off, showCaption: true, mutedPointerUpKeep: false };
  }
  const keep = Boolean(opts.mutedPointerUpKeep);
  if (opts.hoveringCurrent && keep) {
    return { muted: true, namedId: null, showCaption: false, mutedPointerUpKeep: true };
  }
  if (opts.hoveringCurrent && !keep) {
    const current = opts.currentId ?? null;
    return {
      muted: false,
      namedId: current,
      showCaption: Boolean(current),
      mutedPointerUpKeep: false,
    };
  }
  if (keep || opts.muted) {
    return { muted: true, namedId: null, showCaption: false, mutedPointerUpKeep: keep };
  }
  return {
    muted: opts.muted,
    namedId: opts.namedId,
    showCaption: Boolean(opts.namedId) && !opts.muted,
    mutedPointerUpKeep: false,
  };
}

function peekAfterLostCapture(opts) {
  return {
    muted: opts.muted,
    namedId: opts.muted ? null : opts.namedId,
    showCaption: !opts.muted && Boolean(opts.namedId),
    mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
    tickId: opts.tickId ?? opts.landedId,
  };
}

function peekCaptionAfterLostCaptureCurrentHover(opts) {
  const lost = peekAfterLostCapture({
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

test("window blur mid-scrub after keep-clear shares peekCaptionAfterLostCaptureCurrentHover", () => {
  assert.match(src, /peekCaptionAfterLostCaptureCurrentHover/);
  assert.match(src, /applyWindowBlur/);
  assert.match(src, /mutedPointerUpKeep/);
  assert.match(barrel, /peekCaptionAfterLostCaptureCurrentHover/);

  const named = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: false,
    muted: true,
    namedId: null,
    offCurrentNamedId: "frame-other",
    mutedPointerUpKeep: true,
  });
  assert.equal(named.mutedPointerUpKeep, false);

  const lost = peekAfterLostCapture({
    muted: false,
    namedId: null,
    tickId: "frame-other",
    landedId: "frame-now",
    mutedPointerUpKeep: false,
  });
  assert.equal(lost.mutedPointerUpKeep, false);

  const laterCurrent = peekCaptionAfterLostCaptureCurrentHover({
    mutedPointerUpKeep: lost.mutedPointerUpKeep,
    hoveringCurrent: true,
    currentId: "frame-now",
    muted: lost.muted,
    namedId: lost.namedId,
  });
  assert.equal(laterCurrent.mutedPointerUpKeep, false);
  assert.equal(laterCurrent.muted, false);
  assert.equal(laterCurrent.namedId, "frame-now");
  assert.equal(
    peekCaptionNameId({ muted: laterCurrent.muted, namedId: laterCurrent.namedId, fallbackId: "frame-next" }),
    "frame-now",
  );
});
