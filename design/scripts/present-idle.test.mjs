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
  assert.match(chrome, /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*goTo\(p\.id\);/);
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
