import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");

test("Print color chips preview the stroke on hover", () => {
  assert.match(inspector, /setGuideColorPreview\?\.\(\{ id: g\.id, color: c\.hex \}\)/);
  assert.match(inspector, /onMouseEnter/);
  assert.match(inspector, /onMouseLeave/);
});

test("board uses hover preview color when present", () => {
  assert.match(rulers, /guideColorPreview/);
  assert.match(rulers, /colorPreview && colorPreview\.id === g\.id \? colorPreview\.color/);
});

test("store holds a color preview slot", () => {
  assert.match(store, /guideColorPreview: null/);
  assert.match(store, /setGuideColorPreview:/);
});
