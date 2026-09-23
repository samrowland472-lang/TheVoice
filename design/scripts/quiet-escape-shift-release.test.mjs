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
  if (opts.shiftHeld) {
    return {
      namedId: opts.namedId,
      muted: opts.muted || Boolean(opts.quietEscapeKeep),
      showCaption: Boolean(opts.namedId) || (!opts.muted && !opts.quietEscapeKeep),
    };
  }
  if (opts.scrubbing || opts.namedId || opts.muted || opts.quietEscapeKeep) {
    return { namedId: null, muted: true, showCaption: false };
  }
  return { namedId: null, muted: false, showCaption: false };
}

function peekCaptionAfterQuietEscapeShiftRelease(opts) {
  const next = peekCaptionAfterShiftRelease({
    shiftHeld: opts.shiftHeld,
    scrubbing: false,
    namedId: opts.namedId,
    muted: opts.muted,
    quietEscapeKeep: true,
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

test("Shift-release after a quiet Escape keep stays muted and hides the fallback name", () => {
  assert.match(src, /peekCaptionAfterQuietEscapeShiftRelease/);
  assert.match(chrome, /peekCaptionAfterQuietEscapeShiftRelease/);
  assert.match(chrome, /quietEscapeKeep/);

  const next = peekCaptionAfterQuietEscapeShiftRelease({
    shiftHeld: false,
    muted: false,
    namedId: null,
    fallbackId: "frame-next",
  });
  assert.equal(next.namedId, null);
  assert.equal(next.muted, true);
  assert.equal(next.showCaption, false);
  assert.equal(next.captionId, null);
});
