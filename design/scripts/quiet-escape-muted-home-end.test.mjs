import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

function peekCaptionAfterQuietEscape(opts) {
  if (opts.key !== "Escape") {
    return {
      namedId: opts.namedId,
      muted: opts.muted,
      showCaption: Boolean(opts.namedId) || (opts.shiftHeld && !opts.muted),
      stayInPresent: false,
    };
  }
  if (opts.shiftHeld) {
    return { namedId: null, muted: true, showCaption: false, stayInPresent: true };
  }
  return { namedId: null, muted: true, showCaption: false, stayInPresent: false };
}

function peekCaptionNameId(opts) {
  if (opts.namedId) return opts.namedId;
  if (opts.muted) return null;
  return opts.fallbackId;
}

test("Escape after a muted Home/End keep does not restore the next-frame fallback name", () => {
  assert.match(src, /peekCaptionAfterQuietEscape/);
  assert.match(chrome, /peekCaptionAfterQuietEscape/);
  assert.match(chrome, /stayInPresent/);

  const quiet = peekCaptionAfterQuietEscape({
    key: "Escape",
    shiftHeld: true,
    muted: true,
    namedId: null,
  });
  assert.equal(quiet.namedId, null);
  assert.equal(quiet.muted, true);
  assert.equal(quiet.showCaption, false);
  assert.equal(quiet.stayInPresent, true);
  assert.equal(
    peekCaptionNameId({ muted: quiet.muted, namedId: quiet.namedId, fallbackId: "frame-next" }),
    null,
  );
});
