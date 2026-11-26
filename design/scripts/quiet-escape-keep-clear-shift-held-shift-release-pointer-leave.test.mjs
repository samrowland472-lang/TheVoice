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

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerCancel(opts);
}

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseLostPointerCapture(opts);
}

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp(opts);
}

test("pointer-leave after muted keep-clear Shift-held path stays muted so a leave cannot flash the next-frame name", () => {
  assert.match(src, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave/);
  assert.match(src, /return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerUp\(opts\)/);
  assert.match(chrome, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave/);
  assert.match(chrome, /applyQuietKeepClearPointerLeave/);
  assert.match(chrome, /onPointerLeave/);
  assert.match(barrel, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave/);

  const late = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave({
    muted: true,
    namedId: "stale-frame",
    fallbackId: "frame-next",
  });
  assert.equal(late.muted, true);
  assert.equal(late.namedId, null);
  assert.equal(late.showCaption, false);
  assert.equal(late.captionId, null);
  assert.equal(late.mutedPointerUpKeep, false);

  const named = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleasePointerLeave({
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
