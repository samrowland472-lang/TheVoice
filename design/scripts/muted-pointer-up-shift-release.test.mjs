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

function peekCaptionAfterShiftRelease(opts) {
  const keepMute = Boolean(opts.quietEscapeKeep || opts.mutedPointerUpKeep);
  if (opts.shiftHeld) {
    return {
      namedId: opts.namedId,
      muted: opts.muted || keepMute,
      showCaption: Boolean(opts.namedId) || (!opts.muted && !keepMute),
    };
  }
  if (opts.scrubbing || opts.namedId || opts.muted || keepMute) {
    return { namedId: null, muted: true, showCaption: false };
  }
  return { namedId: null, muted: false, showCaption: false };
}

function peekCaptionAfterMutedPointerUpShiftRelease(opts) {
  const next = peekCaptionAfterShiftRelease({
    shiftHeld: opts.shiftHeld,
    scrubbing: false,
    namedId: opts.namedId,
    muted: opts.muted,
    mutedPointerUpKeep: true,
  });
  return {
    muted: next.muted,
    namedId: next.namedId,
    showCaption: next.showCaption,
    captionId: peekCaptionNameId({
      muted: next.muted,
      namedId: next.namedId,
      fallbackId: opts.fallbackId,
    }),
  };
}

test("Shift tap after muted pointer-up keep hides the next-frame fallback name", () => {
  assert.match(src, /peekCaptionAfterMutedPointerUpShiftRelease/);
  assert.match(src, /mutedPointerUpKeep/);
  assert.match(chrome, /peekCaptionAfterMutedPointerUpShiftRelease/);
  assert.match(chrome, /mutedPointerUpKeep/);

  const stale = peekCaptionAfterMutedPointerUpShiftRelease({
    shiftHeld: false,
    muted: false,
    namedId: null,
    fallbackId: "frame-next",
  });
  assert.equal(stale.namedId, null);
  assert.equal(stale.muted, true);
  assert.equal(stale.showCaption, false);
  assert.equal(stale.captionId, null);

  const held = peekCaptionAfterMutedPointerUpShiftRelease({
    shiftHeld: true,
    muted: false,
    namedId: null,
    fallbackId: "frame-next",
  });
  assert.equal(held.namedId, null);
  assert.equal(held.muted, true);
  assert.equal(held.showCaption, false);
  assert.equal(held.captionId, null);
});
