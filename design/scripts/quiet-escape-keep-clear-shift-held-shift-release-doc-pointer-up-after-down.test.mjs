import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const src = readFileSync(new URL("../src/lib/design/present-lost-capture.ts", import.meta.url), "utf8");
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

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftRelease(opts);
}

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp(opts) {
  return peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown(opts);
}

test("document pointer-up after muted keep-clear Shift-held document pointer-down path stays routed through the down mute helper", () => {
  assert.match(chrome, /applyQuietKeepClearDocPointerUp/);
  assert.match(chrome, /applyQuietKeepClearDocPointerDown/);
  assert.match(chrome, /onDocPointerUp/);
  assert.match(
    chrome,
    /const applyQuietKeepClearDocPointerUp = \(\) => \{\s*applyQuietKeepClearDocPointerDown\(\);/,
  );
  assert.match(chrome, /document.addEventListener\("pointerup", onDocPointerUp\)/);
  assert.match(src, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp/);
  assert.match(barrel, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp/);

  const late = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp({
    muted: true,
    namedId: "stale-frame",
    fallbackId: "frame-next",
  });
  assert.equal(late.muted, true);
  assert.equal(late.namedId, null);
  assert.equal(late.showCaption, false);
  assert.equal(late.captionId, null);
  assert.equal(late.mutedPointerUpKeep, false);

  const named = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerUp({
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
