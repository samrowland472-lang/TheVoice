import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");
const src = readFileSync(new URL("../src/lib/design/present-lost-capture.ts", import.meta.url), "utf8");
const barrel = readFileSync(new URL("../src/components/studio/present-peek-pointer.ts", import.meta.url), "utf8");

test("document pointer-down after muted keep-clear Shift-held document pointer-move path stays routed through the move mute helper", () => {
  assert.match(chrome, /applyQuietKeepClearDocPointerDown/);
  assert.match(chrome, /applyQuietKeepClearDocPointerMove/);
  assert.match(chrome, /onDocPointerDown/);
  assert.match(
    chrome,
    /const applyQuietKeepClearDocPointerDown = \(\) => \{\s*applyQuietKeepClearDocPointerMove\(\);/,
  );
  assert.match(chrome, /document.addEventListener\("pointerdown", onDocPointerDown\)/);
  assert.match(src, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown/);
  assert.match(barrel, /peekCaptionAfterQuietEscapeAfterKeepClearShiftHeldShiftReleaseDocPointerDown/);
});
