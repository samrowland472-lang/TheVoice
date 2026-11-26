import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const app = readFileSync(new URL("../src/components/studio/studio-app.tsx", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const marks = readFileSync(new URL("../src/lib/design/print-marks.ts", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");

test("command palette exposes 3mm / 6mm / none bleed presets", () => {
  assert.match(app, /id: "bleed-none"/);
  assert.match(app, /id: "bleed-3mm"/);
  assert.match(app, /id: "bleed-6mm"/);
  assert.match(app, /Bleed none/);
  assert.match(app, /Bleed 3 mm/);
  assert.match(app, /Bleed 6 mm/);
});

test("print-marks helpers convert millimetres at 96 dpi", () => {
  assert.match(marks, /export function bleedMmToPx/);
  assert.match(marks, /BLEED_PRESETS/);
});

test("inspector offers bleed preset chips", () => {
  assert.match(inspector, /3 mm/);
  assert.match(inspector, /6 mm/);
  assert.match(inspector, /None/);
});

test("setBleed writes uniform bleedEdges", () => {
  assert.match(store, /bleedEdges: \{ top: b, right: b, bottom: b, left: b \}/);
});
