import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

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

function peekCaptionAfterLeaveOffCurrentNamedTick(opts) {
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
  assert.match(chrome, /peekCaptionAfterLostCaptureCurrentHover/);
  assert.match(chrome, /applyWindowBlur/);
  assert.match(chrome, /window.addEventListener\("blur", applyWindowBlur\)/);
  assert.match(chrome, /nameCurrentDot/);

  const named = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: false,
    muted: true,
    namedId: null,
    offCurrentNamedId: "frame-other",
    mutedPointerUpKeep: true,
  });
  assert.equal(named.mutedPointerUpKeep, false);

  const leave = peekCaptionAfterLeaveOffCurrentNamedTick({
    namedId: named.namedId,
    currentId: "frame-now",
    muted: named.muted,
    mutedPointerUpKeep: named.mutedPointerUpKeep,
  });
  assert.equal(leave.mutedPointerUpKeep, false);

  const lost = peekAfterLostCapture({
    muted: leave.muted,
    namedId: leave.namedId,
    tickId: "frame-other",
    landedId: "frame-now",
    mutedPointerUpKeep: leave.mutedPointerUpKeep,
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
