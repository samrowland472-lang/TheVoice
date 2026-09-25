import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const chrome = readFileSync(new URL("../src/components/studio/present-chrome.tsx", import.meta.url), "utf8");

test("document pointer-move after muted keep-clear Shift-held document pointer-over path stays routed through the over mute helper", () => {
  assert.match(chrome, /applyQuietKeepClearDocPointerMove/);
  assert.match(chrome, /applyQuietKeepClearDocPointerOver/);
  assert.match(chrome, /onDocPointerMove/);
  assert.match(
    chrome,
    /const applyQuietKeepClearDocPointerMove = \(\) => \{\s*applyQuietKeepClearDocPointerOver\(\);/,
  );
  assert.match(chrome, /document.addEventListener\("pointermove", onDocPointerMove\)/);
});
