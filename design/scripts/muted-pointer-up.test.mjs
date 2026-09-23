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
  assert.match(chrome, /peekCaptionAfterMutedPointerUp/);
  assert.match(chrome, /peekTickAfterMutedPointerUp/);
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
