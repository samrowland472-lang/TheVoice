import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const inspector = readFileSync(new URL("../src/components/studio/inspector.tsx", import.meta.url), "utf8");
const store = readFileSync(new URL("../src/lib/design/store-impl.ts", import.meta.url), "utf8");
const canvas = readFileSync(new URL("../src/components/studio/canvas-stage.tsx", import.meta.url), "utf8");

test("setBleed writes matching bleedEdges", () => {
  assert.match(store, /bleedEdges: \{ top: b, right: b, bottom: b, left: b \}/);
  assert.match(store, /setBleedEdges:/);
});

test("inspector exposes T/R/B/L bleed fields and draggable guides", () => {
  assert.match(inspector, /bleed \$\{edge\}/);
  assert.match(inspector, /drag \$\{g\.axis/);
  assert.match(inspector, /moveGuide\(g\.id/);
  assert.match(inspector, /\+ V/);
  assert.match(inspector, /\+ H/);
  assert.match(inspector, /3 mm/);
  assert.match(inspector, /6 mm/);
});

test("canvas draws live bleed band and persistent guides", () => {
  assert.match(canvas, /drawPrintMarks/);
  assert.match(canvas, /drawDocGuides/);
});
