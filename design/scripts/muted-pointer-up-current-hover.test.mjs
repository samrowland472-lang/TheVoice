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

test("current-page peek hover after muted pointer-up keep hides fallback until off-current name", () => {
  assert.match(src, /peekCaptionAfterMutedPointerUpCurrentHover/);
  assert.match(src, /mutedPointerUpKeep/);
  assert.match(chrome, /peekCaptionAfterMutedPointerUpCurrentHover/);
  assert.match(chrome, /mutedPointerUpKeep/);

  const current = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: true,
    muted: false,
    namedId: null,
    mutedPointerUpKeep: true,
  });
  assert.equal(current.namedId, null);
  assert.equal(current.muted, true);
  assert.equal(current.showCaption, false);
  assert.equal(peekCaptionNameId({ muted: current.muted, namedId: current.namedId, fallbackId: "frame-next" }), null);

  const leave = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: false,
    muted: true,
    namedId: null,
    mutedPointerUpKeep: true,
  });
  assert.equal(leave.muted, true);
  assert.equal(leave.namedId, null);
  assert.equal(leave.showCaption, false);

  const named = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: false,
    muted: true,
    namedId: null,
    offCurrentNamedId: "frame-other",
    mutedPointerUpKeep: true,
  });
  assert.equal(named.muted, false);
  assert.equal(named.namedId, "frame-other");
  assert.equal(named.showCaption, true);
  assert.equal(named.mutedPointerUpKeep, false);
  assert.equal(peekCaptionNameId({ muted: named.muted, namedId: named.namedId, fallbackId: "frame-next" }), "frame-other");

  const laterCurrent = peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: true,
    muted: named.muted,
    namedId: named.namedId,
    currentId: "frame-now",
    mutedPointerUpKeep: named.mutedPointerUpKeep,
  });
  assert.equal(laterCurrent.mutedPointerUpKeep, false);
  assert.equal(laterCurrent.muted, false);
  assert.equal(laterCurrent.namedId, "frame-now");
  assert.equal(peekCaptionNameId({ muted: laterCurrent.muted, namedId: laterCurrent.namedId, fallbackId: "frame-next" }), "frame-now");
});
