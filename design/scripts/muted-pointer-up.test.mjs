import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

function peekCaptionAfterMutedPointerUp(opts) {
  if (opts.muted) {
    return { muted: true, namedId: null, showCaption: false };
  }
  return {
    muted: false,
    namedId: opts.namedId,
    showCaption: Boolean(opts.namedId),
  };
}

function peekTickAfterMutedPointerUp(opts) {
  const keep = opts.tickId ?? opts.landedId;
  if (!keep) return null;
  if (opts.muted) return keep;
  return opts.tickId;
}

test("pointer-up after muted Shift-scrub keeps landed tick and dead caption", () => {
  assert.match(src, /peekCaptionAfterMutedPointerUp/);
  assert.match(src, /peekTickAfterMutedPointerUp/);
  assert.match(src, /peekAfterLostCapture/);
  assert.match(chrome, /peekAfterLostCapture/);
  assert.match(chrome, /onPointerUp/);

  const cap = peekCaptionAfterMutedPointerUp({ muted: true, namedId: "frame-b" });
  assert.equal(cap.muted, true);
  assert.equal(cap.namedId, null);
  assert.equal(cap.showCaption, false);

  const live = peekCaptionAfterMutedPointerUp({ muted: false, namedId: "frame-b" });
  assert.equal(live.muted, false);
  assert.equal(live.namedId, "frame-b");
  assert.equal(live.showCaption, true);

  assert.equal(
    peekTickAfterMutedPointerUp({ tickId: "frame-b", landedId: "frame-c", muted: true }),
    "frame-b",
  );
  assert.equal(
    peekTickAfterMutedPointerUp({ tickId: null, landedId: "frame-c", muted: true }),
    "frame-c",
  );
  assert.equal(
    peekTickAfterMutedPointerUp({ tickId: null, landedId: "frame-c", muted: false }),
    null,
  );
});

function peekAfterLostCapture(opts) {
  const cap = peekCaptionAfterMutedPointerUp({ muted: opts.muted, namedId: opts.namedId });
  return {
    muted: cap.muted,
    namedId: cap.namedId,
    showCaption: cap.showCaption,
    tickId: peekTickAfterMutedPointerUp({
      tickId: opts.tickId,
      landedId: opts.landedId,
      muted: opts.muted || cap.muted,
    }),
  };
}

test("pointer-cancel and window blur mid-capture keep landed tick via muted pointer-up path", () => {
  assert.match(src, /peekAfterLostCapture/);
  assert.match(chrome, /peekAfterLostCapture/);
  assert.match(chrome, /onPointerCancel/);
  assert.match(chrome, /applyLostCapture/);
  assert.match(chrome, /window.addEventListener\("blur"/);

  const lost = peekAfterLostCapture({
    muted: true,
    namedId: "frame-b",
    tickId: null,
    landedId: "frame-c",
  });
  assert.equal(lost.muted, true);
  assert.equal(lost.namedId, null);
  assert.equal(lost.showCaption, false);
  assert.equal(lost.tickId, "frame-c");

  const named = peekAfterLostCapture({
    muted: false,
    namedId: "frame-b",
    tickId: "frame-b",
    landedId: "frame-c",
  });
  assert.equal(named.muted, false);
  assert.equal(named.namedId, "frame-b");
  assert.equal(named.tickId, "frame-b");
});
