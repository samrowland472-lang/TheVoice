import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const src = readFileSync(new URL("../src/lib/design/guide-select.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const shortcuts = readFileSync(new URL("../src/components/studio/use-shortcuts.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const layer = readFileSync(new URL("../src/components/studio/ruler-layer.tsx", import.meta.url), "utf8");

test("nudge helpers exist", () => {
  assert.match(src, /export function nudgeGuidePositions/);
  assert.match(src, /export function toggleGuideIds/);
  assert.match(src, /g\.axis === "x" \? dx : dy/);
});

test("store wires multi-guide select and nudge", () => {
  assert.match(store, /guideSelection: \[\]/);
  assert.match(store, /selectGuides:/);
  assert.match(store, /nudgeGuides:/);
  assert.match(store, /removeSelectedGuides:/);
});

test("arrows nudge selected guides", () => {
  assert.match(shortcuts, /guideSelection\?\.length/);
  assert.match(shortcuts, /nudgeGuides\(dx, dy\)/);
  assert.match(shortcuts, /removeSelectedGuides/);
});

test("inspector and canvas highlight selection", () => {
  assert.match(inspector, /selectGuides\(\[g\.id\], e\.shiftKey\)/);
  assert.match(layer, /selectGuides\(\[existing\.id\], e\.shiftKey\)/);
  assert.match(rulers, /selectedIds/);
  assert.match(rulers, /196,255,77/);
});
