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

test("leave off-current named tick after keep-clear does not restore mutedPointerUpKeep", () => {
  assert.match(src, /peekCaptionAfterLeaveOffCurrentNamedTick/);
  assert.match(chrome, /peekCaptionAfterLeaveOffCurrentNamedTick/);
  assert.match(chrome, /mutedPointerUpKeep/);

  const named = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: false,
    muted: true,
    namedId: null,
    offCurrentNamedId: "frame-other",
    mutedPointerUpKeep: true,
  });
  assert.equal(named.mutedPointerUpKeep, false);
  assert.equal(named.namedId, "frame-other");

  const leave = peekCaptionAfterLeaveOffCurrentNamedTick({
    namedId: named.namedId,
    currentId: "frame-now",
    muted: named.muted,
    mutedPointerUpKeep: named.mutedPointerUpKeep,
  });
  assert.equal(leave.mutedPointerUpKeep, false);
  assert.equal(leave.namedId, null);
  assert.equal(leave.muted, false);
  assert.equal(leave.showCaption, false);

  const laterCurrent = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: true,
    muted: leave.muted,
    namedId: leave.namedId,
    currentId: "frame-now",
    mutedPointerUpKeep: leave.mutedPointerUpKeep,
  });
  assert.equal(laterCurrent.mutedPointerUpKeep, false);
  assert.equal(laterCurrent.muted, false);
  assert.equal(laterCurrent.namedId, "frame-now");
  assert.equal(
    peekCaptionNameId({ muted: laterCurrent.muted, namedId: laterCurrent.namedId, fallbackId: "frame-next" }),
    "frame-now",
  );
});
