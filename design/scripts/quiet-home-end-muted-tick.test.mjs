import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

function peekCaptionAfterQuietHomeEnd(opts) {
  if (opts.key !== "Home" && opts.key !== "End") {
    return {
      namedId: opts.namedId,
      showCaption: opts.shiftHeld && !opts.muted,
      muted: Boolean(opts.muted),
    };
  }
  return { namedId: null, showCaption: false, muted: true };
}

function peekTickAfterQuietHomeEnd(opts) {
  if (opts.key !== "Home" && opts.key !== "End") return opts.tickId;
  if (opts.muted) return opts.tickId;
  return null;
}

function peekCaptionNameId(opts) {
  if (opts.namedId) return opts.namedId;
  if (opts.muted) return null;
  return opts.fallbackId;
}

test("quiet Home/End after a kept faded tick do not revive a dead named caption", () => {
  assert.match(src, /peekCaptionAfterQuietHomeEnd/);
  assert.match(src, /peekTickAfterQuietHomeEnd/);
  assert.match(chrome, /peekCaptionAfterQuietHomeEnd/);
  assert.match(chrome, /peekTickAfterQuietHomeEnd/);
  assert.match(chrome, /applyLostCapture/);
  assert.match(chrome, /peekTickFadeShouldRestartAfterLostCapture/);

  const cap = peekCaptionAfterQuietHomeEnd({
    namedId: "frame-b",
    key: "Home",
    shiftHeld: true,
    muted: true,
  });
  assert.equal(cap.namedId, null);
  assert.equal(cap.showCaption, false);
  assert.equal(cap.muted, true);
  assert.equal(
    peekCaptionNameId({ muted: cap.muted, namedId: cap.namedId, fallbackId: "frame-c" }),
    null,
  );
  assert.equal(
    peekTickAfterQuietHomeEnd({ tickId: "frame-kept", key: "End", muted: true }),
    "frame-kept",
  );
});
