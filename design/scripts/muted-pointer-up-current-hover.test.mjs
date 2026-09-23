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
    return { muted: false, namedId: off, showCaption: true };
  }
  const keep = Boolean(opts.mutedPointerUpKeep) || opts.muted;
  if (opts.hoveringCurrent || keep) {
    return { muted: true, namedId: null, showCaption: false };
  }
  return { muted: opts.muted, namedId: opts.namedId, showCaption: Boolean(opts.namedId) && !opts.muted };
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
  assert.equal(peekCaptionNameId({ muted: named.muted, namedId: named.namedId, fallbackId: "frame-next" }), "frame-other");
});
