import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rulers = readFileSync(new URL("../src/lib/design/rulers.ts", import.meta.url), "utf8");
const inspector = readFileSync(new URL("../src/components/studio/inspector-print.tsx", import.meta.url), "utf8");
const style = readFileSync(new URL("../src/lib/design/guide-style.ts", import.meta.url), "utf8");
const layer = readFileSync(new URL("../src/components/studio/ruler-layer.tsx", import.meta.url), "utf8");

test("pair captions use pairCaptionFill", () => {
  assert.match(rulers, /pairCaptionFill\(pair\.axis, looks, lookPreview/);
  assert.match(rulers, /ctx\.fillStyle = caption/);
});

test("look preview slot lives on the store", () => {
  assert.match(style, /guideLookPreview: null/);
  assert.match(style, /setGuideLookPreview:/);
  assert.match(style, /export function pairCaptionFill/);
  assert.match(style, /preview && preview\.axis === axis/);
});

test("board paint receives look preview", () => {
  assert.match(layer, /s\.guideLookPreview/);
  assert.match(layer, /s\.guideLooks/);
});

test("print look chips preview on hover", () => {
  assert.match(inspector, /setGuideLookPreview\?\.\(\{ axis, color: c\.hex \}\)/);
  assert.match(inspector, /onMouseEnter/);
  assert.match(inspector, /onMouseLeave/);
});
