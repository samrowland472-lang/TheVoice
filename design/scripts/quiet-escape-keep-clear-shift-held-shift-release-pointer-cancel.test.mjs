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

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur(opts);
}

test("pointer-cancel mid muted keep-clear Shift-held path stays muted so a cancelled scrub cannot flash the next-frame name", () => {
  assert.match(src, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel/);
  assert.match(src, /return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseWindowBlur\(opts\)/);
  assert.match(chrome, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel/);
  assert.match(chrome, /applyQuietKeepClearPointerCancel/);
  assert.match(chrome, /pointercancel/);
  assert.match(barrel, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel/);

  const cancelled = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel({
    muted: true,
    namedId: "stale-frame",
    fallbackId: "frame-next",
  });
  assert.equal(cancelled.muted, true);
  assert.equal(cancelled.namedId, null);
  assert.equal(cancelled.showCaption, false);
  assert.equal(cancelled.captionId, null);
  assert.equal(cancelled.mutedPointerUpKeep, false);

  const named = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel({
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
