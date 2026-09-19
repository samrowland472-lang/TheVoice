import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");

test("Print dash chips preview the stroke on hover", () => {
  assert.match(inspector, /setGuideDashPreview\?\.\(\{ id: g\.id, dash: d \}\)/);
  assert.match(inspector, /onMouseEnter/);
  assert.match(inspector, /onMouseLeave/);
});

test("board uses hover preview dash when present", () => {
  assert.match(rulers, /guideDashPreview/);
  assert.match(rulers, /preview && preview\.id === g\.id \? preview\.dash/);
});

test("store holds a dash preview slot", () => {
  assert.match(store, /guideDashPreview: null/);
  assert.match(store, /setGuideDashPreview:/);
});
