import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-lost-capture.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/components/studio/present-peek-pointer.ts", import.meta.url), "utf8");

function peekCaptionNameId(opts) {
  if (opts.namedId) return opts.namedId;
  if (opts.muted) return null;
  return opts.fallbackId;
}

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(opts) {
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

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(opts);
}

test("window-blur mid Shift-release after quiet Escape keep-clear stays muted so focus return cannot revive a stale caption", () => {
  assert.match(src, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur/);
  assert.match(src, /return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease\(opts\)/);
  assert.match(chrome, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur/);
  assert.match(chrome, /applyQuietKeepClearWindowBlur/);
  assert.match(barrel, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur/);

  const blurred = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur({
    muted: true,
    namedId: "stale-frame",
    fallbackId: "frame-next",
  });
  assert.equal(blurred.muted, true);
  assert.equal(blurred.namedId, null);
  assert.equal(blurred.showCaption, false);
  assert.equal(blurred.captionId, null);
  assert.equal(blurred.mutedPointerUpKeep, false);

  const named = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur({
    muted: true,
    namedId: null,
    fallbackId: "frame-next",
    offCurrentNamedId: "frame-other",
  });
  assert.equal(named.muted, false);
  assert.equal(named.namedId, "frame-other");
  assert.equal(named.showCaption, true);
  assert.equal(named.captionId, "frame-other");
});
