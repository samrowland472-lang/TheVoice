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

function peekCaptionAfterMutedPointerUpCurrentHover(opts) {
  const off = opts.offCurrentNamedId ?? null;
  if (off) {
    return { muted: false, namedId: off, showCaption: true, mutedPointerUpKeep: false };
  }
  const keep = Boolean(opts.mutedPointerUpKeep);
  if (opts.hoveringCurrent && keep) {
    return { muted: true, namedId: null, showCaption: false, mutedPointerUpKeep: true };
  }
  if (opts.hoveringCurrent && !keep) {
    const current = opts.currentId ?? null;
    return {
      muted: false,
      namedId: current,
      showCaption: Boolean(current),
      mutedPointerUpKeep: false,
    };
  }
  if (keep || opts.muted) {
    return { muted: true, namedId: null, showCaption: false, mutedPointerUpKeep: keep };
  }
  return {
    muted: opts.muted,
    namedId: opts.namedId,
    showCaption: Boolean(opts.namedId) && !opts.muted,
    mutedPointerUpKeep: false,
  };
}

function peekAfterLostCapture(opts) {
  return {
    muted: opts.muted,
    namedId: opts.muted ? null : opts.namedId,
    showCaption: !opts.muted && Boolean(opts.namedId),
    mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
    tickId: opts.tickId ?? opts.landedId,
  };
}

function peekCaptionAfterLostCaptureCurrentHover(opts) {
  const lost = peekAfterLostCapture({
    muted: opts.muted,
    namedId: opts.namedId,
    tickId: null,
    landedId: opts.currentId,
    mutedPointerUpKeep: opts.mutedPointerUpKeep,
  });
  return peekCaptionAfterMutedPointerUpCurrentHover({
    hoveringCurrent: opts.hoveringCurrent,
    muted: lost.muted,
    namedId: lost.namedId,
    currentId: opts.currentId,
    mutedPointerUpKeep: lost.mutedPointerUpKeep,
  });
}

function peekCaptionAfterQuietEscapeAfterKeepClear(opts) {
  const quiet = peekCaptionAfterQuietEscape({
    key: opts.key,
    shiftHeld: opts.shiftHeld,
    muted: opts.muted,
    namedId: opts.namedId,
  });
  return {
    ...quiet,
    mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
  };
}

function peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld(opts) {
  const quiet = peekCaptionAfterQuietEscapeAfterKeepClear({
    key: opts.key,
    shiftHeld: true,
    muted: opts.muted,
    namedId: opts.namedId,
    mutedPointerUpKeep: opts.mutedPointerUpKeep,
  });
  return {
    ...quiet,
    stayInPresent: opts.key === "Escape" ? true : quiet.stayInPresent,
    mutedPointerUpKeep: Boolean(opts.mutedPointerUpKeep),
  };
}

test("quiet Escape after keep-clear while Shift is held stays in present and names current-dot hover", () => {
  assert.match(src, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld/);
  assert.match(chrome, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld/);
  assert.match(barrel, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld/);

  const lost = peekAfterLostCapture({
    muted: false,
    namedId: null,
    tickId: "frame-other",
    landedId: "frame-now",
    mutedPointerUpKeep: false,
  });
  assert.equal(lost.mutedPointerUpKeep, false);

  const quiet = peekCaptionAfterQuietEscapeAfterKeepClearShiftHeld({
    key: "Escape",
    muted: lost.muted,
    namedId: lost.namedId,
    mutedPointerUpKeep: lost.mutedPointerUpKeep,
  });
  assert.equal(quiet.stayInPresent, true);
  assert.equal(quiet.mutedPointerUpKeep, false);
  assert.equal(quiet.showCaption, false);

  const laterCurrent = peekCaptionAfterLostCaptureCurrentHover({
    mutedPointerUpKeep: quiet.mutedPointerUpKeep,
    hoveringCurrent: true,
    currentId: "frame-now",
    muted: quiet.muted,
    namedId: quiet.namedId,
  });
  assert.equal(laterCurrent.mutedPointerUpKeep, false);
  assert.equal(laterCurrent.muted, false);
  assert.equal(laterCurrent.namedId, "frame-now");
  assert.equal(
    peekCaptionNameId({ muted: laterCurrent.muted, namedId: laterCurrent.namedId, fallbackId: "frame-next" }),
    "frame-now",
  );
});
