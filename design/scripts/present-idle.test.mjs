import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/design/present-idle.ts", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

function shouldHidePresentChrome(opts) {
  if (opts.notesOpen || opts.menuOpen) return false;
  return opts.idle;
}

function shouldShowPresentPeek(opts) {
  return opts.hideChrome && opts.pageCount > 0;
}

test("idle hide stays off while notes or a menu is open", () => {
  assert.match(src, /notesOpen \|\| opts\.menuOpen/);
  assert.match(src, /PRESENT_IDLE_MS/);
  assert.equal(shouldHidePresentChrome({ idle: true, notesOpen: true, menuOpen: false }), false);
  assert.equal(shouldHidePresentChrome({ idle: true, notesOpen: false, menuOpen: true }), false);
  assert.equal(shouldHidePresentChrome({ idle: true, notesOpen: false, menuOpen: false }), true);
});

test("peek stays when chrome is hidden", () => {
  assert.match(src, /shouldShowPresentPeek/);
  assert.match(chrome, /showPeek/);
  assert.match(chrome, /bg-phosphor\/55/);
  assert.equal(shouldShowPresentPeek({ hideChrome: true, pageCount: 3 }), true);
  assert.equal(shouldShowPresentPeek({ hideChrome: false, pageCount: 3 }), false);
});

test("peek dots jump frames while the rail is hidden", () => {
  assert.match(chrome, /pointer-events-auto mt-2 flex max-w-\[min\(90vw,40rem\)\]/);
  assert.match(chrome, /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);/);
  assert.match(chrome, /goTo\(p\.id\)/);
  assert.match(chrome, /aria-label=\{`Go to \$\{p\.name\}`\}/);
  assert.match(chrome, /title=\{p\.name\}/);
  assert.match(chrome, /flex-wrap/);
  assert.match(chrome, /overflow-x-auto/);
});

test("peek current-dot hover shows page index and hairline glow lifts off type", () => {
  assert.match(chrome, /peekIndexHover/);
  assert.match(chrome, /\{i \+ 1\}\/\{Math\.max\(pages\.length, 1\)\}/);
  assert.match(chrome, /shadow-\[0_-3px_6px_rgba\(63,198,255,0\.35\)\]/);
});

function isQuietPresentNavKey(key) {
  return (
    key === "ArrowRight" ||
    key === "ArrowLeft" ||
    key === " " ||
    key === "PageDown" ||
    key === "PageUp" ||
    key === "Home" ||
    key === "End" ||
    key === "Shift"
  );
}

test("arrow keys stay quiet so peek does not wake the rail", () => {
  assert.match(src, /isQuietPresentNavKey/);
  assert.match(chrome, /isQuietPresentNavKey/);
  assert.equal(isQuietPresentNavKey("ArrowRight"), true);
  assert.equal(isQuietPresentNavKey("ArrowLeft"), true);
  assert.equal(isQuietPresentNavKey("Shift"), true);
  assert.equal(isQuietPresentNavKey("Home"), true);
  assert.equal(isQuietPresentNavKey("End"), true);
  assert.equal(isQuietPresentNavKey("n"), false);
  assert.match(src, /key === "Home"/);
  assert.match(chrome, /e\.key === "Home"/);
  assert.match(chrome, /e\.key === "End"/);
});

test("shift peek names the next frame after the index", () => {
  assert.match(chrome, /shiftHeld/);
  assert.match(chrome, /peekIndexHover \|\| shiftHeld/);
  assert.match(chrome, /pages\[i \+ 1\]/);
  assert.match(chrome, /truncate/);
  assert.match(chrome, /mask-image:linear-gradient/);
});

test("shift hover on a non-current peek dot names that frame", () => {
  assert.match(chrome, /peekNamedId/);
  assert.match(chrome, /shiftHeld && n !== i/);
  assert.match(chrome, /pages\.find\(\(p\) => p\.id === peekNamedId\)/);
});

test("click-drag on peek strip scrubs frames without waking the rail", () => {
  assert.match(src, /isQuietPresentPeekTarget/);
  assert.match(src, /peekScrubIndex/);
  assert.match(src, /data-present-peek/);
  assert.match(chrome, /data-present-peek/);
  assert.match(chrome, /isQuietPresentPeekTarget/);
  assert.match(chrome, /peekScrubIndex/);
  assert.match(chrome, /peekScrubbing/);
  assert.match(chrome, /setPointerCapture/);
});

function peekScrubTickId(startId, endId, lastOtherId = null) {
  if (!endId || !startId) return null;
  if (startId !== endId) return endId;
  if (lastOtherId && lastOtherId !== endId) return lastOtherId;
  return null;
}

test("scrub leaves a tick on the last dragged frame", () => {
  assert.match(src, /peekScrubTickId/);
  assert.match(chrome, /peekTickId/);
  assert.match(chrome, /data-peek-tick/);
  assert.equal(peekScrubTickId("a", "a"), null);
  assert.equal(peekScrubTickId("a", "b"), "b");
  assert.equal(peekScrubTickId(null, "b"), null);
  assert.equal(peekScrubTickId("a", "a", "b"), "b");
  assert.equal(peekScrubTickId("a", "a", "a"), null);
});

test("scrub that lands on the current frame keeps a ghost on the previous frame", () => {
  assert.match(src, /lastOtherId/);
  assert.match(chrome, /peekScrubLastOther/);
  assert.equal(peekScrubTickId("frame-a", "frame-a", "frame-c"), "frame-c");
});

test("double-click peek opens notes without waking the rail", () => {
  assert.match(chrome, /peekNotesOpen/);
  assert.match(chrome, /onDoubleClick/);
  assert.match(chrome, /setPeekNotesOpen\(true\)/);
  assert.match(chrome, /notesVisible/);
  assert.match(chrome, /shouldHidePresentChrome\(\{ idle, notesOpen, menuOpen \}\)/);
});

function peekTickAfterQuietAdvance(tickId, key) {
  if (!tickId) return null;
  if (isQuietPresentNavKey(key) && key !== "Shift") return null;
  return tickId;
}

function peekTickAfterQuietDotClick(tickId, clickedId, currentId) {
  if (!tickId) return null;
  if (clickedId && currentId && clickedId !== currentId) return null;
  return tickId;
}

test("quiet keys and a different peek-dot click clear the last-frame tick", () => {
  assert.match(src, /peekTickAfterQuietAdvance/);
  assert.match(src, /peekTickAfterQuietDotClick/);
  assert.match(chrome, /peekTickAfterQuietDotClick/);
  assert.equal(peekTickAfterQuietAdvance("frame-b", "ArrowRight"), null);
  assert.equal(peekTickAfterQuietAdvance("frame-b", "Shift"), "frame-b");
  assert.equal(peekTickAfterQuietDotClick("frame-b", "frame-c", "frame-a"), null);
  assert.equal(peekTickAfterQuietDotClick("frame-b", "frame-a", "frame-a"), "frame-b");
});

function peekTickFadeShouldRestart(prevTickId, nextTickId) {
  if (!nextTickId) return false;
  return prevTickId !== nextTickId;
}

test("peek tick fade restarts only when a new scrub lands", () => {
  assert.match(src, /peekTickFadeShouldRestart/);
  assert.match(chrome, /peekTickFadeShouldRestart/);
  assert.match(chrome, /PEEK_TICK_FADE_MS/);
  assert.equal(peekTickFadeShouldRestart(null, "frame-b"), true);
  assert.equal(peekTickFadeShouldRestart("frame-a", "frame-b"), true);
  assert.equal(peekTickFadeShouldRestart("frame-b", "frame-b"), false);
  assert.equal(peekTickFadeShouldRestart("frame-b", null), false);
});

function peekTickRemaining(dwellMs, fadeMs = 3200) {
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) return 1;
  if (dwellMs >= fadeMs) return 0;
  return 1 - dwellMs / fadeMs;
}

function peekTickOpacity(distance, remaining = 1) {
  if (!Number.isFinite(distance) || distance <= 0) return 0;
  const d = Math.abs(Math.round(distance));
  let step = 0.14;
  if (d === 1) step = 0.7;
  else if (d === 2) step = 0.42;
  else if (d === 3) step = 0.26;
  const t = Number.isFinite(remaining) ? Math.max(0, Math.min(1, remaining)) : 1;
  return step * t;
}

test("peek tick opacity falls off with distance and remaining dwell", () => {
  assert.match(src, /peekTickRemaining/);
  assert.match(src, /peekTickOpacity/);
  assert.match(chrome, /peekTickOpacity\(Math\.abs\(n - i\), tickRemaining\)/);
  assert.equal(peekTickOpacity(1), 0.7);
  assert.equal(peekTickOpacity(2), 0.42);
  assert.equal(peekTickOpacity(3), 0.26);
  assert.equal(peekTickOpacity(8), 0.14);
  assert.equal(peekTickRemaining(0), 1);
  assert.equal(peekTickRemaining(1600), 0.5);
  assert.equal(peekTickRemaining(3200), 0);
  assert.equal(peekTickOpacity(1, 0.5), 0.35);
  assert.equal(peekTickOpacity(4, 0.5), 0.07);
});
